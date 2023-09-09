from flask import Flask, jsonify
from googleapiclient.discovery import build
import googleapiclient
from analysis import AnalysisSingleton
from comments import CommentProcessor
import json

app = Flask(__name__)
api_key = "AIzaSyBtxJEet5gIXlbXD2gtCKwcss98JnT-Am0"
youtube = build("youtube", "v3", developerKey=api_key)


@app.route("/<video_id>")
def get_comments(video_id: str):
    cp = CommentProcessor(api_key)
    top_comments = cp.get_comment_threads(video_id)
    analyser = AnalysisSingleton()
    res = [
        analyser.calculate_sentiment_statistics(top_comments),
        analyser.calculate_emotion_statistics(top_comments),
        analyser.calculate_derision_statistics(top_comments),
    ]
    print(res)
    return jsonify(top_comments)


if __name__ == "__main__":
    app.run(port=8080)
