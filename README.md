[![travis build](https://img.shields.io/travis/com/SimonSiefke/vscode-svg-preview.svg?style=flat-square)](https://travis-ci.com/SimonSiefke/vscode-svg-preview) [![Version](https://vsmarketplacebadge.apphb.com/version/SimonSiefke.svg-preview.svg)](https://marketplace.visualstudio.com/items?itemName=SimonSiefke.svg-preview) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release) [![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)

# Svg Preview for VSCode

![demo](./demo_images/demo.gif)

<!-- TODO need to figure out why animation is restarted so often -->
<!-- TODO work in html -->
<!-- TODO update content when just opened -->
<!-- TODO handle active text editor before extension is activated -->
<!-- TODO vscode live share -->
<!-- TODO allow custom styles instead of checkerboard pattern -->

## Features

- Live editing of svg files
- Panning of the preview
- Zooming (currently work in progress)

## Settings

| Property | Description | Default |
| --- | --- | --- |
| svgPreview.autoOpen | Automatically open the preview when an svg file is opened | `false` |
| svgPreview.style | The background of the preview | `{ body: {}, img: {} }` |

## How to use the `svgPreview.style` setting

You can change the background color:

![demo of the svg preview with white background](./demo_images/demo_white_background.png)

```json
{
  "svgPreview.style": {
    "body": {
      "background": "white"
    }
  }
}
```

Or make a gradient background (note that you need to use `-webkit` prefix radial gradients):

![demo of the svg preview with a blue gradient background](./demo_images/demo_gradient_background.png)

```json
{
  "svgPreview.style": {
    "body": {
      "background": "-webkit-radial-gradient(center, circle cover, hsl(195, 80%, 20%) 0%,hsl(220, 100%, 5%) 100%)"
    }
  }
}
```

Or you can make a checkerboard background:

![demo of the svg preview with a checkerboard pattern background](./demo_images/demo_checkerboard_background.png)

```json
{
  "svgPreview.style": {
    "body": {
      "background-position": "0 0, 13px 13px",
      "background-size": "26px 26px",
      "background-image": "linear-gradient(45deg,  #141414 25%, transparent 25%, transparent 75%, #141414 75%, #141414), linear-gradient(45deg, #141414 25%, transparent 25%, transparent 75%, #141414 75%, #141414)"
    }
  }
}
```
