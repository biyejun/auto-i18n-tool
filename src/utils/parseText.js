Object.defineProperty(exports, '__esModule', { value: true })

require('repl')

/**
 * Create a cached version of a pure function.
 */
function cached(fn) {
  var cache = Object.create(null)
  return function cachedFn(str) {
    var hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}

var validDivisionCharRE = /[\w).+\-_$\]]/

function parseFilters(exp) {
  var inSingle = false
  var inDouble = false
  var inTemplateString = false
  var inRegex = false
  var curly = 0
  var square = 0
  var paren = 0
  var lastFilterIndex = 0
  var c, prev, i, expression, filters

  for (i = 0; i < exp.length; i++) {
    prev = c
    c = exp.charCodeAt(i)
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) { inSingle = false }
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) { inDouble = false }
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) { inTemplateString = false }
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) { inRegex = false }
    } else if (
      c === 0x7C && // pipe
      exp.charCodeAt(i + 1) !== 0x7C &&
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren
    ) {
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1
        expression = exp.slice(0, i).trim()
      } else {
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break // "
        case 0x27: inSingle = true; break // '
        case 0x60: inTemplateString = true; break // `
        case 0x28: paren++; break // (
        case 0x29: paren--; break // )
        case 0x5B: square++; break // [
        case 0x5D: square--; break // ]
        case 0x7B: curly++; break // {
        case 0x7D: curly--; break // }
      }
      if (c === 0x2f) { // /
        var j = i - 1
        var p = (void 0)
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j)
          if (p !== ' ') { break }
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true
        }
      }
    }
  }

  if (expression === undefined) {
    expression = exp.slice(0, i).trim()
  } else if (lastFilterIndex !== 0) {
    pushFilter()
  }

  function pushFilter() {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim())
    lastFilterIndex = i + 1
  }

  return expression
}

/*  */

var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g

var buildRegex = cached(function(delimiters) {
  var open = delimiters[0].replace(regexEscapeRE, '\\$&')
  var close = delimiters[1].replace(regexEscapeRE, '\\$&')
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
})

function parseText(
  text,
  delimiters
) {
  var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE
  if (!tagRE.test(text)) {
    return
  }
  var tokens = []
  var rawTokens = []
  var lastIndex = tagRE.lastIndex = 0
  var match, index, tokenValue
  while ((match = tagRE.exec(text))) {
    index = match.index
    // push text token
    if (index > lastIndex) {
      tokenValue = text.slice(lastIndex, index)
      rawTokens.push({
        start: lastIndex,
        end: index,
        type: 'static',
        'binding': tokenValue
      })
      tokens.push(JSON.stringify(tokenValue))
    }
    // tag token
    var exp = parseFilters(match[1].trim())
    tokens.push(('_s(' + exp + ')'))
    rawTokens.push({
      'binding': exp,
      start: index,
      type: 'dynamic',
      end: index + match[0].length
    })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) {
    tokenValue = text.slice(lastIndex)
    rawTokens.push({
      start: lastIndex,
      end: text.length,
      type: 'static',
      'binding': tokenValue
    }
    )
    tokens.push(JSON.stringify(tokenValue))
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}

exports.parseText = parseText
