import showdown from 'showdown';
import xssFilter from 'showdown-xss-filter';

window.tgShowdownConverter = new showdown.Converter({
  omitExtraWLInCodeBlocks: true,
  noHeaderId: true,
  parseImgDimensions: true,
  simplifiedAutoLink: true,
  excludeTrailingPunctuationFromURLs: true,
  literalMidWordUnderscores: true,
  strikethrough: true,
  tables: true,
  disableForced4SpacesIndentedSublists: true,
  simpleLineBreaks: true,
  requireSpaceBeforeHeadingText: true,
  openLinksInNewWindow: true,
  extensions: [xssFilter],
});
