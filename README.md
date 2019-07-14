[![travis build](https://img.shields.io/travis/com/SimonSiefke/vscode-svg-preview.svg?style=flat-square)](https://travis-ci.com/SimonSiefke/vscode-svg-preview) [![Version](https://vsmarketplacebadge.apphb.com/version/SimonSiefke.svg-preview.svg)](https://marketplace.visualstudio.com/items?itemName=SimonSiefke.svg-preview) [![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)

# Svg Preview for VSCode

![demo](./demo_images/demo.gif)

<!-- TODO better demo gif -->
<!-- TODO need to figure out why animation is restarted so often / prevent unnecessary updates -->
<!-- TODO update content when just opened / handle active text editor before extension is activated-->
<!-- TODO vscode live share -->
<!-- TODO rename reset to reload or a different icon? -->
<!-- TODO don't zoom/pan outside of the window -->
<!-- TODO improve external css -->
<!-- TODO add tests -->
<!-- TODO bug with commented out </svg> inside html/js etc -->
<!-- TODO bug open svg, open preview, close svg, open other svg (title changes), switch to preview -> content not updated -->
<!-- TODO sometimes buggy when new version is installed -->
<!-- TODO bug: when deleted file and open another file, preview is not updated -->
<!-- TODO prevent short flickering of error icon when preview is opened -->
<!-- TODO feature idea: move preview with arrow keys -->
<!-- TODO feature idea: zoom with ctrl+arrow key up/down -->

## Features

- Live editing of svg files and svg's inside files
- Panning and zooming of the preview (up to 2620%)

## Commands

- Svg Preview: Open Preview to the Side
- Svg Preview: Reset Preview

## Settings

| Property | Description | Default |
| --- | --- | --- |
| svgPreview.autoOpen | Automatically open the preview when an svg file is opened | `false` |
| svgPreview.scaleToFit | Whether or not the svg should be scaled to fit the viewport or keep its original size | `true` |
| svgPreview.style | Custom style for the preview | `{}` |

## How to use the `svgPreview.style` setting

You can change the background color:

![demo of the svg preview with white background](./demo_images/demo_white_background.png)

```json
{
  "svgPreview.style": {
    "html": {
      "background": "white"
    }
  }
}
```

Or you can make a checkerboard background:

![demo of the svg preview with a checkerboard pattern background](./demo_images/demo_checkerboard_background.png)

```json
{
  "svgPreview.style": {
    "html": {
      "background-position": "0 0, 13px 13px",
      "background-size": "26px 26px",
      "background-image": "linear-gradient(45deg, #141414 25%, transparent 25%, transparent 75%, #141414 75%, #141414), linear-gradient(45deg, #141414 25%, transparent 25%, transparent 75%, #141414 75%, #141414)"
    }
  }
}
```
