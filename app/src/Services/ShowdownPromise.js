export default new Promise(async (resolve) => {
  const showdownImport = import(/* webpackChunkName: "showdown" */ 'showdown');
  const xssFilterImport = import(
    /* webpackChunkName: "showdown-xss-filter" */ 'showdown-xss-filter'
  );

  const showdown = (await showdownImport).default;
  const xssFilter = (await xssFilterImport).default;

  resolve(
    new showdown.Converter({
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
    }),
  );
});
