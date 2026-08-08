/**
 * @typedef {Object} Host
 * @property {string|null} name - The name of the host, which may be extracted from the webpage or set to null if not available.
 * @property {string} origin - The origin URL of the host, which is the base URL without any path or query parameters (e.g., "https://www.example.com").
 */

/**
 * @typedef {Object} Webpage
 * @property {string} association - The association or organization related to the sporting event (e.g., "UEFA", "FIFA").
 * @property {string} league - The league or competition of the sporting event (e.g., "Champions League", "World Cup").
 * @property {string} sportingEvent - The name of the sporting event (e.g., "Real Madrid vs Barcelona").
 * @property {string} time - The time of the sporting event in 24-hour format (HH:mm).
 * @property {boolean} isTime24H - A boolean indicating whether the time is in 24-hour format (true) or not (false).
 * @property {boolean} isRepeated - A boolean indicating whether the sporting event is repeated (i.e., has more than one URL).
 * @property {string[]} urls - An array of URLs where the sporting event can be streamed.
 * @property {State} state - An object containing the state of the webpage, such as color, message, and url, which can be used for displaying the status of streaming detection on our server.
 * @property {VideoData} [videoData] - An object containing the video data of the sporting event, such as src, resolution, config, currentTime, paused, volume, buffered, playbackQuality, playbackEfficiency, readyState, networkState.
 * @property {StreamData} [streamData] - An object containing the stream data of the sporting event, such as headers, url, averageBandwidth, bandwidth, resolution, frameRate, codecs, closedCaptions, responsesFromNetworkEvents, responsesFromPerformanceEntries.
 */

/**
 * @typedef {Object} State
 * @property {string} color - The color representing the state of the webpage, which can be used for visual indicators (e.g., "green" for successful streaming detection, "yellow" for partial success or issues, "red" for failure).
 * @property {string} message - A message describing the state of the webpage, which can provide more context about the streaming detection status (e.g., "Successfully found streaming on our server from:", "Failed to find streaming in webpage performance entries on our server from:", "Failed to load webpage on our server with status: ... from:").
 * @property {string} url - The URL of the webpage that the state is associated with, which can be used for reference or debugging purposes.
 * @property {string} [error] - An optional string containing any error message or details related to the state of the webpage, which can be used for troubleshooting or logging purposes.
 */

/**
 * @typedef {Object} VideoData
 * @property {string} src - The current URL of the video stream.
 * @property {string} resolution - The resolution of the video stream (e.g., "1080x720").
 * @property {Object} config - An object containing the configuration of the video stream, such as autoplay, controls, loop, muted, poster.
 * @property {integer} currentTime - The current playback time of the video in seconds.
 * @property {boolean} paused - A boolean indicating whether the video is currently paused.
 * @property {float} volume - The current volume level of the video, ranging from 0.0 (muted) to 1.0 (full volume).
 * @property {integer} buffered - The amount of the video that is currently buffered in seconds.
 * @property {Object} playbackQuality - An object containing the playback quality metrics of the video, such as creationTime, totalVideoFrames, droppedVideoFrames, corruptedVideoFrames, totalFrameDelay, averageFrameDelay.
 * @property {float} playbackEfficiency - A number representing the playback efficiency of the video, calculated as 1 - (droppedVideoFrames / totalVideoFrames), or null if totalVideoFrames is 0 or not available.
 * @property {integer} readyState - An integer representing the ready state of the video, where 0 (HAVE_NOTHING) means no information is available, 1 (HAVE_METADATA) means metadata is available, 2 (HAVE_CURRENT_DATA) means current data is available, 3 (HAVE_FUTURE_DATA) means future data is available, and 4 (HAVE_ENOUGH_DATA) means enough data is available for playback.
 * @property {integer} networkState - An integer representing the network state of the video, where 0 (NETWORK_EMPTY) means no network activity, 1 (NETWORK_IDLE) means network is idle, 2 (NETWORK_LOADING) means network is loading, and 3 (NETWORK_NO_SOURCE) means no source is available.
 */

/**
 * @typedef {Object} StreamData
 * @property {ResponseHeaderFromNetworkEvents} [headers] - An object containing the response headers from master playlist or manifest of the video stream that triggered the network event, such as access-control-allow-origin, access-control-allow-credentials, content-type, accept-ranges, content-encoding, x-sid, referer.
 * @property {string} [url] - The URL from master playlist or manifest of the video stream that triggered the network event.
 * @property {string} [averageBandwidth] - The average bandwidth from master playlist of the video stream that triggered the network event.
 * @property {string} [bandwidth] - The bandwidth from master playlist or manifest of the video stream that triggered the network event.
 * @property {string} [resolution] - The resolution from master playlist or manifest of the video stream that triggered the network event (e.g., "1080x720").
 * @property {string} [frameRate] - The frame rate from master playlist or manifest of the video stream that triggered the network event (e.g., "30fps").
 * @property {string} [codecs] - The codecs from master playlist or manifest of the video stream that triggered the network event (e.g., "avc1.640028, mp4a.40.2").
 * @property {string} [closedCaptions] - The closed captions from master playlist of the video stream that triggered the network event (e.g., "en", "es").
 * @property {ResponseFromNetworkEvents[]} [responsesFromNetworkEvents] - An array of objects containing the responses data from media playlist of the video stream that triggered the network events, such as headers, url, mediaSequence, targetDuration, segmentDuration.
 * @property {ResponseFromPerformanceEntries[]} [responsesFromPerformanceEntries] - An array of objects containing the responses data from the performance entries of the video stream that triggered the performance entries, such as name, responseStatus, startTime, duration, responseEnd.
 */

/**
 * @typedef {Object} ResponseFromNetworkEvents
 * @property {ResponseHeaderFromNetworkEvents} headers - An object containing the response headers from media playlist of the video stream that triggered the network event, such as access-control-allow-origin, access-control-allow-credentials, content-type, accept-ranges, content-encoding, x-sid, referer.
 * @property {string} url - The URL from media playlist of the video stream that triggered the network event.
 * @property {string} mediaSequence - The media sequence number from media playlist of the video stream that triggered the network event.
 * @property {string} targetDuration - The target duration of the segments from media playlist of the video stream that triggered the network event.
 * @property {string} segmentDuration - The duration of the segment from media playlist of the video stream that triggered the network event.
 */

/**
 * @typedef {Object} ResponseHeaderFromNetworkEvents
 * @property {string} [access-control-allow-origin] - The value of the Access-Control-Allow-Origin header from the response of the video stream that triggered the network event.
 * @property {string} [access-control-allow-credentials] - The value of the Access-Control-Allow-Credentials header from the response of the video stream that triggered the network event.
 * @property {string} [content-type] - The value of the Content-Type header from the response of the video stream that triggered the network event.
 * @property {string} [accept-ranges] - The value of the Accept-Ranges header from the response of the video stream that triggered the network event.
 * @property {string} [content-encoding] - The value of the Content-Encoding header from the response of the video stream that triggered the network event.
 * @property {string} [x-sid] - The value of the X-SID header from the response of the video stream that triggered the network event.
 * @property {string} referer - The value of the Referer header from the request of the video stream that triggered the network event.
 */

/**
 * @typedef {Object} ResponseFromPerformanceEntries
 * @property {string} name - The name of the resource from the performance entry of the video stream that triggered the performance entry, which is usually the URL of the resource.
 * @property {integer} responseStatus - The response status code of the resource from the performance entry of the video stream that triggered the performance entry (e.g., 200, 404).
 * @property {float} startTime - The start time of the resource from the performance entry of the video stream that triggered the performance entry, in milliseconds since the navigation started.
 * @property {float} duration - The duration of the resource from the performance entry of the video stream that triggered the performance entry, in milliseconds.
 * @property {float} responseEnd - The response end time of the resource from the performance entry of the video stream that triggered the performance entry, in milliseconds since the navigation started.
 */

/**
 * Exports an empty object to allow importing the typedefs in other files without causing errors. The typedefs are used for documentation and type checking purposes, and do not have any runtime behavior.
 */
module.exports = {};
