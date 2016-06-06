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
    url: approot + "/get/indicators/" + locale,
    dataType: "json",
    success: function(data) {
      var indicator_list = $(target).empty();
      $(target).append("<ul>");
      for (indicator in data) {
        $(target).append('<li><a href="' + approot + '/view/indicator/' + locale + '/' + 
                         data[indicator].id + '">' + 
                         data[indicator].display[locale] + '</a></li>');
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
    URL = approot + "/search/" + locale + "/" + $('#search_query').val();
  } else { 
    URL = approot + "/indicator";
  }
  var xhr = $.ajax({
    url: URL,
    dataType: "json",
    success: function(data) {
      $(target).empty();
      $(target).append('<ul>');
      for (indicator in data) {
        $(target).append('<li><a href="' + approot + '/view/indicator/' + locale + '/' + 
                         data[indicator].id + '">' + 
                         data[indicator].display[locale] + '</a></li>');
      }
      $(target).append("</ul>");
    },
    error: function(xhr,ajaxOptions,thrownError) {
      console.log("Failed to get search result for query: " + $('#search_query').val());
    }
  });
}


$(document).ready(function() {
  populateIndicatorList('indicator_list');

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

