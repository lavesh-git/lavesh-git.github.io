# Local, read-only preview of this repository's Liquid layouts and Markdown.
require 'json'
require 'yaml'
require 'date'
require 'uri'
require 'fileutils'
require 'optparse'
require 'liquid'
require 'kramdown'
require 'kramdown-parser-gfm'
require 'rouge'
require 'webrick'

options = { root: File.expand_path('..', __dir__), port: 8765 }
OptionParser.new do |parser|
  parser.on('--source PATH') { |value| options[:root] = File.expand_path(value) }
  parser.on('--port PORT', Integer) { |value| options[:port] = value }
  parser.on('--build-only') { options[:build_only] = true }
end.parse!
ROOT = options[:root]

def frontmatter(file)
  raw = File.read(file)
  return [{}, raw] unless raw.start_with?("---\n")
  _, front, body = raw.split(/^---\s*$\n?/, 3)
  [YAML.safe_load(front, permitted_classes: [Date, Time], aliases: false) || {}, body || '']
end

module PreviewFilters
  def where(input, key, value); Array(input).select { |item| item[key] == value }; end
  def jsonify(input); JSON.generate(input); end
  def markdownify(input); Kramdown::Document.new(input.to_s, input: 'GFM', syntax_highlighter: 'rouge').to_html; end
  def uri_escape(input); URI::DEFAULT_PARSER.escape(input.to_s); end
  def relative_url(input)
    base = @context['site']['baseurl'].to_s.sub(%r{/$}, '')
    base + '/' + input.to_s.sub(%r{^/}, '')
  end
  def absolute_url(input); @context['site']['url'].to_s + relative_url(input); end
end
class PreviewInclude < Liquid::Tag
  def initialize(name, markup, tokens)
    super
    @file = markup.split.first
    @attributes = markup.scan(/(\w+)\s*=\s*("[^"]*"|'[^']*'|[^\s]+)/)
  end
  def render(context)
    raise 'Invalid include path' unless @file.match?(%r{\A[\w.-]+\z})
    context.stack do
      context['include'] = @attributes.to_h.transform_values { |value| context.evaluate(Liquid::Expression.parse(value)) }
      Liquid::Template.parse(File.read(File.join(ROOT, '_includes', @file)), error_mode: :strict).render!(context)
    end
  end
end
Liquid::Template.register_filter(PreviewFilters)
Liquid::Template.register_tag('include', PreviewInclude)

def source_files
  Dir.glob(File.join(ROOT, '**', '*'), File::FNM_DOTMATCH).select do |file|
    File.file?(file) && !file.delete_prefix(ROOT + '/').split('/').any? { |part| part.start_with?('.') }
  end
end

def build_site
  config = YAML.safe_load(File.read(File.join(ROOT, '_config.yml')))
  excluded = Array(config['exclude'])
  files = source_files.reject do |file|
    path = file.delete_prefix(ROOT + '/')
    excluded.any? { |entry| path == entry || path.start_with?(entry + '/') }
  end
  pages = files.filter_map do |file|
    path = file.delete_prefix(ROOT + '/')
    next if path.start_with?('_') || !path.match?(/\.(md|html)$/)
    data, body = frontmatter(file)
    next if data.empty?
    defaults = Array(config['defaults']).reduce({}) do |values, rule|
      scope = rule.fetch('scope', {})
      prefix = scope.fetch('path', '')
      matches = (prefix.empty? || path == prefix || path.start_with?(prefix + '/')) && [nil, 'pages'].include?(scope['type'])
      matches ? values.merge(rule.fetch('values', {})) : values
    end
    data = defaults.merge(data)
    next if data['published'] == false
    url = data['permalink'] || '/' + path.sub(/\.(md|html)$/, '.html').sub(/index\.html$/, '')
    data.merge('path' => path, 'name' => File.basename(file), 'url' => url, 'body' => body, 'content' => body)
  end
  config['pages'] = pages
  config['github'] = { 'build_revision' => 'local-preview' }
  output = {}
  pages.each do |page|
    assigns = { 'site' => config, 'page' => page }
    content = Liquid::Template.parse(page['body'], error_mode: :strict).render!(assigns)
    if page['path'].end_with?('.md')
      content = Kramdown::Document.new(content, input: 'GFM', syntax_highlighter: 'rouge').to_html
    end
    layout = page['layout']
    seen = []
    while layout
      raise 'Circular layout' if seen.include?(layout)
      seen << layout
      data, body = frontmatter(File.join(ROOT, '_layouts', layout + '.html'))
      content = Liquid::Template.parse(body, error_mode: :strict).render!(assigns.merge('content' => content))
      layout = data['layout']
    end
    # Validate generated data before making a preview available.
    content.scan(/<script id="library-data" type="application\/json">(.*?)<\/script>/m).each { |match| JSON.parse(match.first) }
    path = URI::DEFAULT_PARSER.unescape(page['url'])
    path += 'index.html' if path.end_with?('/')
    output[path] = [content, 'text/html; charset=utf-8']
  end
  files.each do |file|
    path = file.delete_prefix(ROOT + '/')
    next unless path.start_with?('assets/') || path.match?(%r{\ANotebooks/.+/assets/})
    next if path.end_with?('.md')
    output['/' + path] = [File.binread(file), WEBrick::HTTPUtils.mime_type(file, WEBrick::HTTPUtils::DefaultMimeTypes)]
  end
  warn "Preview ready: #{pages.length} pages; Liquid, Markdown and JSON validated."
  output
end

# filter_map is available on Ruby 2.7+; support the macOS system Ruby too.
unless [].respond_to?(:filter_map)
  class Array
    def filter_map; map { |item| yield item }.compact; end
  end
end
site = build_site
exit if options[:build_only]
signature = source_files.map { |file| [file, File.mtime(file).to_f, File.size(file)] }
server = WEBrick::HTTPServer.new(BindAddress: '127.0.0.1', Port: options[:port], AccessLog: [], Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN))
server.mount_proc('/') do |request, response|
  begin
    current = source_files.map { |file| [file, File.mtime(file).to_f, File.size(file)] }
    if current != signature
      site = build_site
      signature = current
    end
    path = request.path.end_with?('/') ? request.path + 'index.html' : request.path
    entry = site[path]
    response.status = entry ? 200 : 404
    response['Content-Type'] = entry ? entry[1] : 'text/plain; charset=utf-8'
    response['Cache-Control'] = 'no-store'
    response.body = entry ? entry[0] : 'Page not found'
  rescue StandardError => error
    warn error.full_message
    response.status = 500
    response['Content-Type'] = 'text/plain; charset=utf-8'
    response.body = "Preview build failed: #{error.message}"
  end
end
trap('INT') { server.shutdown }
trap('TERM') { server.shutdown }
warn "Local review: http://127.0.0.1:#{options[:port]}/library-preview/ (Ctrl+C to stop)"
server.start
