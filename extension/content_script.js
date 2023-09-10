/**
 * Implements the main functionality of the extension:
 * * Make requests to server via background script.
 * * Display results on the YouTube webpage.
 */

"use strict";

// Server responses to compare against
const response_wait_str = "";
const response_timeout_error = "";

// How long to wait in between checking if the DOM is loaded, in milliseconds
const dom_check_interval = 400;


function init(){
  console.log("[YouTube Comment Analyser] Script is starting...");
  
  let url = new URL(window.location.href);
  let video_id = url.searchParams.get("v");
  console.log("[YouTube Comment Analyser] Video ID:", video_id);
  
  // Request information from the server via the background worker
  chrome.runtime.sendMessage({ method: "getCommentData", video_id: video_id }, function (response) {
    console.log("[YouTube Comment Analyser] Got server response:", response);
    if(response != undefined){
      displayResults(response);
    }else{
      console.error("[YouTube Comment Analyser] Invalid response from background script.");
    }
    
  });
  
}

/**
 * Check if the relevant parts of the DOM are available to insert the comment analysis.
 * @returns {Boolean} True if the relevant parts of the DOM are available.
 */
function checkIfCommentsLoaded(){
  let comment_sections_container = document.getElementById("sections");
  if(comment_sections_container == null){
    return false;
  }
  
  let comment_header = comment_sections_container.firstElementChild.firstElementChild;
  if(comment_header == null){
    return false;
  }
  
  return true;
}

/**
 * Modify the DOM of the YouTube page to display the results of the comment analysis.
 * @param {Object} results The sentiment analysis results.
 */
function displayResults(results){
  
  // Wait for a while if the DOM isn't ready.
  if(!checkIfCommentsLoaded()){
    setTimeout(
      function(){
        displayResults(results);
      },
      dom_check_interval
    );
    return;
  }
  
  // Create the container for the analysis results
  let analysis_container = document.createElement("div");
  analysis_container.id = "analyser-container";
  analysis_container.classList.add("style-scope");
  analysis_container.classList.add("ytd-comments-header-renderer");
  
  // Create the header
  let analysis_header = document.createElement("span");
  analysis_header.id = "analysis-header";
  analysis_header.classList.add("analyser-text");
  analysis_header.classList.add("analyser-header-text");
  analysis_header.innerHTML = "Comment Analysis:";
  analysis_container.appendChild(analysis_header);
  
  let analysis_container_h_flex = document.createElement("div");
  analysis_container_h_flex.classList.add("analysis-horizontal-flex");
  
  analysis_container_h_flex.appendChild(createSentimentDisplay(results));
  analysis_container_h_flex.appendChild(createEmotionDisplay(results));
  analysis_container_h_flex.appendChild(createSarcasmDisplay(results));
  
  analysis_container.appendChild(analysis_container_h_flex);
  
  // Add the analysis container to the DOM
  let comment_header = document.getElementById("sections").firstElementChild.firstElementChild;
  comment_header.insertBefore(analysis_container, comment_header.children[5]);
  
  console.log("[YouTube Comment Analyser] analysis_container:", analysis_container);
  
}

function createSentimentDisplay(results){
  
  // Process the data
  let total_comments = results.sentiment_analysis.positive[1] + results.sentiment_analysis.neutral[1] + results.sentiment_analysis.negative[1];
  let percent_positive = Math.round(results.sentiment_analysis.positive[1] / total_comments * 100);
  let percent_neutral  = Math.round(results.sentiment_analysis.neutral[1]  / total_comments * 100);
  let percent_negative = Math.round(results.sentiment_analysis.negative[1] / total_comments * 100);
  let percentages = [percent_positive, percent_neutral, percent_negative];
  
  // Create the sentiment analysis container
  let analysis_sentiment_container = document.createElement("div");
  analysis_sentiment_container.id = "analysis-sentiment-display";
  analysis_sentiment_container.classList.add("analysis-data-container");
  
  /*
  <div id="analysis-sentiment-display" class="analysis-data-container">
  <div class="circle green" style="width: 100px;height: 100px;border-radius: 50%;display: flex;flex-direction: column;justify-content: center;align-items: center;color: #3498db;font-weight: bold;background-color: transparent;box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);position: relative;">
    <span style="font-size: 18px;">50%</span>
    <svg class="ring" style="width: 100px;height: 100px;position: absolute;top: 0;left: 0;transform: rotate(-90deg);z-index: 1;">
      <circle cx="50%" cy="50%" stroke-dasharray="251.2" stroke-dashoffset="0" style="fill: none;stroke-width: 10px;stroke-dasharray: 251.2;stroke-dashoffset: 150;transition: stroke-dashoffset 1s ease-in-out;stroke: #2ecc71;" r="40%"></circle>
    </svg>
  </div>
  */
  
  let colors = ["green", "yellow", "red"];
  let hover_titles = ["Positive", "Neutral", "Negative"];
  
  for(var p = 0;p < percentages.length;p ++){
    
    const percentage = percentages[p];
    const circumference = 2 * Math.PI * 40; // Radius is 40
    const offset = ((100 - percentage) / 100) * circumference;
    
    let circle_div = document.createElement("div");
    circle_div.classList.add("analysis-circle-container");
    circle_div.title = hover_titles[p] + " sentiment";
    let percentage_text = document.createElement("span");
    circle_div.appendChild(percentage_text);
    percentage_text.innerHTML = percentage+"%";
    
    let svgNS = "http://www.w3.org/2000/svg";
    let circle_svg = document.createElementNS(svgNS, "svg");
    circle_svg.classList.add("analysis-ring");
    circle_div.appendChild(circle_svg);
    
    let circle_poly = document.createElementNS(svgNS, "circle");
    circle_poly.classList.add("analysis-circle", "analysis-circle-"+colors[p]);
    circle_poly.setAttributeNS(null, "cx", "50%");
    circle_poly.setAttributeNS(null, "cy", "50%");
    circle_poly.setAttributeNS(null, "r", "40%");
    circle_poly.setAttributeNS(null, "stroke-dasharray", "251.2");
    circle_poly.setAttributeNS(null, "stroke-dashoffset", "0");
    circle_poly.style.strokeDashoffset = offset;
    circle_svg.appendChild(circle_poly);
    
    analysis_sentiment_container.appendChild(circle_div);
    
  }
  
  //let analysis_sentiment_text = document.createElement("span");
  //analysis_sentiment_text.id = "analysis-sentiment-text";
  //analysis_sentiment_text.classList.add("analyser-text");
  //analysis_sentiment_text.classList.add("analyser-content-text");
  //let sentiment_string =       percent_positive + "% of comments are positive.";
  //sentiment_string += "<br>" + percent_neutral + "% of comments are neutral.";
  //sentiment_string += "<br>" + percent_negative + "% of comments are negative.";
  //analysis_sentiment_text.innerHTML = sentiment_string;
  //analysis_sentiment_container.appendChild(analysis_sentiment_text);
  
  return analysis_sentiment_container;
  
}

function createEmotionDisplay(results){
  
  // Process the data
  let total_comments = results.sentiment_analysis.positive[1] + results.sentiment_analysis.neutral[1] + results.sentiment_analysis.negative[1];
  let percent_emotion0 = Math.round(Object.values(results.emotion_analysis)[0][1] / total_comments * 100);
  let percent_emotion1 = Math.round(Object.values(results.emotion_analysis)[1][1] / total_comments * 100);
  let percent_emotion2 = Math.round(Object.values(results.emotion_analysis)[2][1] / total_comments * 100);
  
  // Create the emotion analysis container
  let analysis_emotion_container = document.createElement("div");
  analysis_emotion_container.id = "analysis-emotion-display";
  analysis_emotion_container.classList.add("analysis-data-container");
  
  let analysis_emotion_text = document.createElement("span");
  analysis_emotion_text.id = "analysis-emotion-text";
  analysis_emotion_text.classList.add("analyser-text");
  analysis_emotion_text.classList.add("analyser-content-text");
  let emoition_string =       percent_emotion0 + "% of comments are " + Object.keys(results.emotion_analysis)[0] + ".";
  emoition_string += "<br>" + percent_emotion1 + "% of comments are " + Object.keys(results.emotion_analysis)[1] + ".";
  emoition_string += "<br>" + percent_emotion2 + "% of comments are " + Object.keys(results.emotion_analysis)[2] + ".";
  analysis_emotion_text.innerHTML = emoition_string;
  analysis_emotion_container.appendChild(analysis_emotion_text);
  
  return analysis_emotion_container;
  
}

function createSarcasmDisplay(results){
  
  // Create the sarcasm analysis container
  let analysis_sarcasm_container = document.createElement("div");
  analysis_sarcasm_container.id = "analysis-emotion-display";
  analysis_sarcasm_container.classList.add("analysis-data-container");
  
  let analysis_sarcasm_text = document.createElement("span");
  analysis_sarcasm_text.id = "analysis-emotion-text";
  analysis_sarcasm_text.classList.add("analyser-text");
  analysis_sarcasm_text.classList.add("analyser-content-text");
  let sarcasm_string = Math.round(results.sarcasm_analysis*100) + "% of comments are sarcastic.";
  analysis_sarcasm_text.innerHTML = sarcasm_string;
  analysis_sarcasm_container.appendChild(analysis_sarcasm_text);
  
  return analysis_sarcasm_container;
  
}



init();