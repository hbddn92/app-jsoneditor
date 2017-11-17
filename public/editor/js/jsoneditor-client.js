(function(exports, $) {

  var debugx = function() {
    console.log.apply(console, arguments);
  }
  debugx.enabled = true;

  var container = document.getElementById('jsoneditor');

  var options = {
    mode: 'code',
    modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
    onError: function (err) {
      alert(err.toString());
    },
    onModeChange: function (newMode, oldMode) {
      debugx.enabled && debugx('Mode switched from %s to %s', oldMode, newMode);
    }
  };

  var json = {};

  var editor = new JSONEditor(container, options, json);

  exports.JsonEditorClient = function(params) {
    var self = this;
    params = params || {};

    var documentId = null;

    $('#actionButtons').append(substitute('<button class="btn btn-default %CLASS%" type="button" data-toggle="tooltip" title="%TITLE%" id="%ID%">%LABEL%</button>', {
      '%CLASS%': 'actionButton',
      '%ID%': 'load',
      '%LABEL%': 'Load',
      '%TITLE%': 'Load the top message from recyclebin'
    }));

    $('.actionButton').click(function() {
      var docId = $('#jsoneditorTextList option:selected').val();
      if (docId) {
        documentId = docId;
        self.loadJsonDocument(documentId);
      }
    });

    var submitAction = params.submitAction || {};
    var submitOptions = submitAction.options || [];
    debugx.enabled && debugx('Submit options: %s', JSON.stringify(submitOptions));
    submitOptions.forEach(function(option) {
      $('#submitButtons').append(substitute('<button class="btn btn-default %CLASS%" type="button" data-toggle="tooltip" title="%TITLE%" id="%ID%">%LABEL%</button>', {
        '%CLASS%': 'submitButton',
        '%ID%': option.value,
        '%LABEL%': option.label,
        '%TITLE%': option.description
      }));
    });

    $('.submitButton').click(function() {
      var action = $(this).attr('id');
      debugx.enabled && debugx('Submit action: %s', action);
      if (documentId && action) {
        self.saveJsonDocument(documentId, { action: action });
      }
    })

    self.loadConfigList = function() {
      var listAction = params.listAction;
      $.getJSON(listAction.path, {}).done(function( agents ) {
        $('#jsoneditorTextList').append('<option value="__NULL__">(choose a document)</option>');
        agents = agents || [];
        agents.forEach(function(agent) {
          agent = agent || {};
          $('#jsoneditorTextList').append('<option value="' + agent.name + '">' + agent.description + '</option>');
        })
      }).fail(function(error) {
        debugx.enabled && debugx("loadDocumentList() - error: %s", JSON.stringify(error));
      });

      $('#jsoneditorTextList').change(function() {
        documentId = $(this).val();
        self.loadJsonDocument(documentId);
      });
    };

    self.loadJsonDocument = function(id) {
      if (id == '__NULL__') return;
      $.getJSON(substitute(params.loadAction.path, {
        "%DOCUMENT_ID%": id
      }), {}).done(function( jsonContent ) {
        editor.set(jsonContent);
      });
    }

    self.saveJsonDocument = function(id, options) {
      if (id == '__NULL__') return;
      var myData = Object.assign({action: options.action}, editor.get());
      $.ajax({
          type: 'PUT',
          contentType: 'application/json',
          headers: {
              Accept: "application/json"
          },
          dataType: 'json',
          url: substitute(params.submitAction.path, {
            "%DOCUMENT_ID%": id
          }),
          data: JSON.stringify(myData)
      });
    }

    $('[data-toggle="tooltip"]').tooltip();
  };

  function substitute(str, data) {
    var output = str.replace(/%[^%]+%/g, function(match) {
        if (match in data) {
            return(data[match]);
        } else {
            return("");
        }
    });
    return(output);
  }
})(this, jQuery);
