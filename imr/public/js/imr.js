/*
 * Handler for imr.html
 */

/*
 * Download and display the list of available indicators
 *
 */

function populateIndicatorList ( id ) {
  var target = '#' + id;
  var xhr = $.ajax({
    url: "/indicator",
    dataType: "json",
    success: function(data) {
      var indicator_list = $(target).empty();
      $(target).append("<ul>");
      for (indicator in data) {
        $(target).append('<li><a href="#" onclick="populateIndicator(this,\'' + 
                         data[indicator].code + '\')">' + 
                         data[indicator].name + '</a></li>');
      }
      $(target).append("</ul>");
    },
    error: function(xhr,ajaxOptions,thrownError) {
      console.log("Failed to get indicator list");
    }
  });
}

/*
 *  
 *
 */

function searchIndicatorList () {
  var target = '#indicator_list';
  var query = $('#search_query').val();
  var URL = null;
  if ((query != null) && (query != "")) {
    URL = "/search/" + $('#search_query').val();
  } else { 
    URL = "/indicator";
  }
  var xhr = $.ajax({
    url: URL,
    dataType: "json",
    success: function(data) {
      $(target).empty();
      $(target).append('<ul>');
      for (indicator in data) {
        $(target).append('<li><a href="#" onclick="populateIndicator(this,\'' + 
                         data[indicator].code + '\')">' + 
                         data[indicator].name + '</a></li>');
      }
      $(target).append("</ul>");
    },
    error: function(xhr,ajaxOptions,thrownError) {
      console.log("Failed to get search result for query: " + $('#search_query').val());
    }
  });
}

/*
 * Retreive the data for the requested indicator code and display
 * it in the browser
 *
 */

var psi = null;

function populateIndicator ( obj , code ) {
  if (psi != null) {
    $(psi).removeClass("selected");
  }
  psi = obj;
  $(psi).addClass("selected");
  var target = '#indicator';
  var xhr = $.ajax({
    url: "/indicator/" + code,
    dataType: "json",
    success: function(data) {
      $(target).empty();
      $(target).append("<h2>" + data.name + " (" + data.code + ")</h2><br />");
      $(target).append("Download as: ");
      $(target).append("<a href=\"/indicator/" + data.code + "\">JSON</a>");
      $(target).append("<br /><br />");
      $(target).append("<table>");
      for (p in data.property) {
        $(target).append("<tr><th>" + IMR_PROPERTY[p] + 
                         "</th><td>" + data.property[p] + 
                         "</td></tr>");
      };
      $(target).append("<tr><th colspan=\"2\">Notes</th></tr>");
      for (n in data.note) {
        $(target).append("<tr><th>" + n + "</th><td>" + data.note[n] + "</td></tr>");
      }
      $(target).append("</table>");
    },
    error: function(xhr,ajaxOptions,thrownError) {
      console.log("Failed to get indicator " + code);
    }
  });
}



/*
 * When the page is loaded, we immediately download and display the list
 * of avaiable indicators, and arbitrarily pick CHI_1 to display 
 *
 */

var IMR_PROPERTY = null;

$(document).ready(function() {
  var xhr = $.ajax({
    url: "/properties",
    dataType: "json",
    success: function(data) {
      IMR_PROPERTY = data;
      // Load the initial list and a first indicator
      populateIndicatorList('indicator_list');
      populateIndicator('indicator','CHI_1');
    },
    error: function(xhr,ajaxOptions,thrownError) {
      console.log("Failed to load property definitions");
    }
   });


  // Bind the search functions to the corresponding UI elements

  $('#search_go').click(function() {
    searchIndicatorList();
  });
  $('#search_query').change(function() {
    searchIndicatorList();
  });
  $('#search_clear').click(function() {
    $('#search_query').val('');
    searchIndicatorList();
  });
 
  // clear the search  input field

  $('#search_query').val('');
});

