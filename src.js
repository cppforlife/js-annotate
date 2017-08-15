function TableAnnotatable($el, opts) {
  if ($el.length != 1) {
    alert('TableAnnotatable: internal error: more than one element');
  }

  opts = opts || {};
  opts.Transpose = $el.attr("data-js-annotate-transpose") == 'true';

  function setUp() {
    // Annotations may have raw HTML for formatting
    var text = $el.find("pre").html();
    var table = extractAnnotations(text);
    var html = '';

    for (var i=0; i < table.length; i++) {
      var con = table[i].content;
      var ann = table[i].annotation;

      if (con == "" && ann == "") {
        continue
      }

      // if content inside pre ends with a new line, browsers do not render it; add br.
      var conEnd = con.length > 0 && con[con.length-1] == '\n' ? '<br/>' : '';

      if (opts.Transpose) {
        html += '<tr><td class="annotation">'+ann+'<td></tr>';
        if (con.length > 0) {
          html += '<tr><td class="content"><pre>'+con+'</pre></td></tr>';
        }
      } else {
        html += '<tr><td class="content"><pre>'+con+'</pre>'+
          conEnd+'</td><td class="annotation">'+ann+'<td></tr>';
      }
    }

    $el.html('<table>'+html+'</table>');
  }

  function extractAnnotations(text) {
    var rx = /\n? *?\/\*([\s\S]+?)\*\/\n?/mg;
    var table = [];
    var start = 0;

    while(start >= 0) {
      var content = "", annotation = "";

      var res = rx.exec(text);
      if (res) {
        content = text.slice(start, res.index);
        annotation = res[1];
        start = res.index+res[0].length;
      } else {
        content = text.slice(start);
        start = -1;
      }

      if (annotation.length > 0 && annotation[0] == '-') {
        content = content.replace(/\n*$/mg, '');
        annotation = annotation.slice(1);
      }

      if (table.length == 0) {
        table.push({annotation: "", content: content});
      } else {
        table[table.length-1].content = content;
      }
      table.push({annotation: annotation, content: ""});
    }

    return table;
  }

  setUp();

  return {};
}

function TableColumnCopyable($el, copyCallback) {
  if ($el.length != 1) {
    alert('TableColumnCopyable: internal error: more than one element');
  }

  // Based on https://stackoverflow.com/a/27530627
  var selectedColumnClass = null;
  var $table = $el.find('table');

  function setUp() {
    $table.addClass("table-selectable");

    $table[0].addEventListener("mousedown", function(e) {
      var $td = e.target.nodeName == 'TD' ? $(e.target) : $(e.target).parent('td');
      if ($td.length == 0) return;
      if ($td[0].classList.contains('annotation')) {
        $table[0].classList.remove('selecting-content');
        $table[0].classList.add('selecting-annotation');
        selectedColumnClass = 'annotation';
      } else if ($td[0].classList.contains('content')) {
        $table[0].classList.remove('selecting-annotation');
        $table[0].classList.add('selecting-content');
        selectedColumnClass = 'content';
      }
    });

    $table[0].addEventListener("copy", function(e) {
      var clipboardData = e.clipboardData;
      var text = getSelectedText();
      clipboardData.setData('text', text);
      e.preventDefault();
      if (copyCallback) copyCallback(text)
    });
  }

  function getSelectedText() {
    var sel = window.getSelection(),
        range = sel.getRangeAt(0),
        doc = range.cloneContents(),
        nodes = doc.querySelectorAll('tr'),
        text = '',
        cls = selectedColumnClass;

    if (nodes.length === 0) {
      text = doc.textContent;
    } else {
      [].forEach.call(nodes, function(tr, i) {
        for (j=0; j<tr.cells.length; j++) {
          var td = tr.cells[j];
          if (td.classList.contains(cls)) {
            text += (i ? '\n' : '') + td.textContent;  
          }
        }
      });
    }
    
    return text;
  }

  setUp();

  return {};  
}

$(document).ready(function() {
  $('body').append('<style> \
.table-selectable.selecting-content td.annotation, \
.table-selectable.selecting-content td.annotation *, \
.table-selectable.selecting-content th.annotation, \
.table-selectable.selecting-content th.annotation *, \
.table-selectable.selecting-annotation td.content, \
.table-selectable.selecting-annotation td.content *, \
.table-selectable.selecting-annotation th.content, \
.table-selectable.selecting-annotation th.content * { \
  -webkit-touch-callout: none; \
  -webkit-user-select: none; \
  -khtml-user-select: none; \
  -moz-user-select: none; \
  -ms-user-select: none; \
  user-select: none; \
} \
.table-selectable.selecting-content td.annotation::selection, \
.table-selectable.selecting-content td.annotation *::selection, \
.table-selectable.selecting-content th.annotation::selection, \
.table-selectable.selecting-content th.annotation *::selection, \
.table-selectable.selecting-annotation td.content::selection, \
.table-selectable.selecting-annotation td.content *::selection, \
.table-selectable.selecting-annotation th.content::selection, \
.table-selectable.selecting-annotation th.content *::selection { \
  background: transparent; \
} \
</style>');
});
