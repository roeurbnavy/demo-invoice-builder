import jQuery from 'jquery'

type Style = Partial<CSSStyleDeclaration>
export type Options = {
  containerStyle?: Style // style for print container
  customClass?: string[]
  beforePrint?: () => void // function called before iframe is filled
  afterPrint?: () => void // function called before iframe is removed
  printDelay?: number
  loading?:
  | boolean
  | string
  | {
    lock?: boolean
    text?: string
    background?: string
    spinner?: string
    customClass?: string
  }
}

export const createPrintIframe = () => {
  const $iframe = jQuery(
    '<iframe id="print-iframe" height="200px" width="200px" border="0" wmode="Opaque"/>'
  )
    .prependTo('body')
    .css({
      position: 'absolute',
      top: -9999,
      left: -9999,
    }) as JQuery<HTMLIFrameElement>

  // Fix print shows an extra blank page
  $iframe
    .contents()
    .find('html, body')
    .css({ height: 'auto', 'box-sizing': 'border-box' })

  // Add import css to iframe
  jQuery('link[rel=stylesheet]').each(function () {
    const href = jQuery(this).attr('href')
    if (href) {
      $iframe
        .contents()
        .find('head')
        .append("<link type='text/css' rel='stylesheet' href='" + href + "'>")
    }
  })
  jQuery('style').each(function () {
    $iframe.contents().find('head').append(this.outerHTML)
  })
}

export const removePrintIframe = () => {
  const $iframe = jQuery('#print-iframe')
  if ($iframe.length) {
    $iframe.remove()
  }
}

const createStyle = (doc: Document, cssText: string, dataName?: string) => {
  const style = doc.createElement('style')
  if (dataName) style.setAttribute('data-name', dataName)
  style.appendChild(doc.createTextNode(cssText))
  return style
}

export default async (
  element: JQuery<HTMLElement> | string,
  opt: Options = {}
) => {
  let loadingInstance: any = null
  try {
    const $element =
      element instanceof jQuery
        ? (element as JQuery<HTMLElement>).clone()
        : jQuery(element as string).clone()

    if (!opt.printDelay) opt.printDelay = 800

    if (opt.loading !== false) {
      const loadingOpts = typeof opt.loading === 'object' ? opt.loading : {}

    }

    // Auto-create iframe if it doesn't exist yet
    if (!document.getElementById('print-iframe')) {
      removePrintIframe()
      createPrintIframe()
    }

    const $iframe = jQuery<HTMLIFrameElement>('#print-iframe')
    const contentWindow = $iframe.get(0)?.contentWindow

    if (!contentWindow) {
      console.error(`Couldn't print, no iframe found!`)
      if (loadingInstance) {
        loadingInstance.close()
      }
      return
    }

    // Reset old iframe content
    resetContent($iframe)

    // Re-sync all styles from the main document so the iframe always has
    // up-to-date styles (scoped component styles, Tailwind utilities, etc.)
    // syncStyles($iframe) // old style
    await syncStyles($iframe)

    // Set container style
    if (opt.containerStyle)
      $element.css(opt.containerStyle as { [key: string]: string })

    const $head = $iframe.contents().find('head')

    // Append custom styles
    if (Array.isArray(opt.customClass)) {
      opt.customClass.forEach((value) => {
        if (value) {
          $head.append(createStyle(document, value, 'x-custom-style'))
        }
      })
    }

    // Append body content
    $iframe.contents().find('body').append($element)

    // Hook events that will remove itself after done
    const beforePrint = () => {
      if (typeof opt?.beforePrint === 'function') opt.beforePrint()
      contentWindow.removeEventListener('beforeprint', beforePrint)
    }
    const afterPrint = () => {
      if (loadingInstance) {
        loadingInstance.close()
        loadingInstance = null
      }
      if (typeof opt?.afterPrint === 'function') opt.afterPrint()
      window.removeEventListener('focus', afterPrint)
      removePrintIframe()
    }

    // Add callback event hook
    if (contentWindow) {
      contentWindow.addEventListener('beforeprint', beforePrint)
      contentWindow.addEventListener('afterprint', afterPrint)
    }

    // Call print
    setTimeout(async () => {
      try {
        contentWindow.focus()
        contentWindow.print()
      } finally {
        if (loadingInstance) {
          loadingInstance.close()
          loadingInstance = null
        }
      }
    }, opt.printDelay)
  } catch (error) {
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
    throw error
  }
}

/**
 * Sync all <link rel="stylesheet"> and <style> tags from the main document
 * into the iframe head so that the iframe always reflects the current styles.
 * Existing non-custom styles are removed first to avoid duplicates.
 */

// const syncStyles = ($iframe: JQuery<HTMLIFrameElement>) => {
//   const $iframeHead = $iframe.contents().find('head')

//   // Remove previously synced styles (not custom ones)
//   $iframeHead.find('link[rel="stylesheet"]').remove()
//   $iframeHead.find('style:not([data-name="x-custom-style"])').remove()

//   // Re-add all <link rel="stylesheet"> from main document
//   jQuery('link[rel=stylesheet]').each(function () {
//     const href = jQuery(this).attr('href')
//     if (href) {
//       $iframeHead.append(
//         "<link type='text/css' rel='stylesheet' href='" + href + "'>"
//       )
//     }
//   })

//   // Re-add all <style> tags (includes scoped Vue component styles)
//   jQuery('style').each(function () {
//     $iframeHead.append(this.outerHTML)
//   })
// }

const syncStyles = async (
  $iframe: JQuery<HTMLIFrameElement>
): Promise<void> => {
  const $iframeHead = $iframe.contents().find('head')

  $iframeHead.find('link[rel="stylesheet"]').remove()
  $iframeHead.find('style:not([data-name="x-custom-style"])').remove()

  const linkPromises: Promise<void>[] = []

  jQuery('link[rel=stylesheet]').each(function () {
    const href = jQuery(this).attr('href')
    if (!href) return
    const p = new Promise<void>((resolve) => {
      const linkEl = document.createElement('link')
      linkEl.rel = 'stylesheet'
      linkEl.type = 'text/css'
      linkEl.href = href
      linkEl.onload = () => resolve()
      linkEl.onerror = () => resolve() // don't hang forever on a 404/blocked asset
      $iframeHead.get(0)?.appendChild(linkEl)
    })
    linkPromises.push(p)
  })

  jQuery('style').each(function () {
    $iframeHead.append(this.outerHTML)
  })

  return Promise.all(linkPromises).then(() => { })
}

const resetContent = ($iframe: JQuery<HTMLIFrameElement>) => {
  // Clear iframe body content
  $iframe.contents().find('body').html('')
  // Remove custom styles from opt.customClass
  $iframe
    .contents()
    .find('head')
    .contents()
    .remove('*[data-name="x-custom-style"]')
}
