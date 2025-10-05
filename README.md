# Shelly Plus Power Profiling
Use the scripting feature of Shelly Plus and later devices to record power profiles that can be seen in the [Firefox Profiler](https://profiler.firefox.com).

# Usage

Visit http://shelly.combien-consomme.fr/ or download the `index.html` file and open it in a web browser.

Note: To have permission to request data from Shelly devices in your local network, the page needs to be either a local file, or hosted on a non-https url.

The `shelly-script.js` file contains the script that needs to be added to the Shelly Plus device (eg. Shelly PlusPlugS) on which the power metering needs to happen.

On the web page, configure the IP address of your Shelly device in your local network (eg. 192.168.1.89) and the script URL.
