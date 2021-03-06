/**
 * Generic utility functions 
 * (C) 2015 - 2018 TekMonks. All rights reserved.
 */

 /**
  * @return Current Timestamp
  */
function getDateTime() {
    const date = new Date();

    let hour = date.getHours(); hour = (hour < 10 ? "0" : "") + hour;
    let min = date.getMinutes(); min = (min < 10 ? "0" : "") + min;
    let sec = date.getSeconds(); sec = (sec < 10 ? "0" : "") + sec;
    let year = date.getFullYear();
    let month = date.getMonth() + 1; month = (month < 10 ? "0" : "") + month;
    let day = date.getDate(); day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}

/**
 * Converts the given IP into a byte buffer.
 * @param {string} ip 
 */
function getIPAsBytes(ip) {
    const ipAnalyzed = analyzeIPAddr(ip);
    const bytes = Buffer.alloc(ipAnalyzed.ipv6?16:4);
    const splits = (ipAnalyzed.ipv6?expandIPv6Address(ipAnalyzed.ip):ipAnalyzed.ip).split(ipAnalyzed.ipv6?":":".");
    for (let i = 0; i < splits.length; i++) (ipAnalyzed.ipv6?bytes.writeUInt16BE:bytes.writeUInt8).call(bytes, parseInt(splits[i],ipAnalyzed.ipv6?16:10), ipAnalyzed.ipv6?i*2:i);

    return bytes;
}

/**
 * Takes in a Buffer object and returns String corresponding to its IP
 * @param {Buffer} bytes 
 */
function getIPFromBytes(bytes) {
    if (bytes.length == 4) return bytes.join(".");  // IPv4
    
    const retIP = "";
    for (let i = 0; i < 16; i+=2) {
        const int16 = bytes.slice(i, i+2).readUInt16BE();
        retIp += int16 + i == 14? "" : ":";
    }

    return retIP;
}

/**
 * Expands the IPv6 IP and returns it
 * @param {string} address 
 */
function expandIPv6Address(address) // from: https://gist.github.com/Mottie/7018157
{
    let fullAddress = "", expandedAddress = "", validGroupCount = 8, validGroupSize = 4, ipv4 = "";
    const extractIpv4 = /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/, validateIpv4 = /((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})/;

    // look for embedded ipv4
    if (validateIpv4.test(address)) {
        const groups = address.match(extractIpv4);
        for(let i=1; i<groups.length; i++) ipv4 += ("00" + (parseInt(groups[i], 10).toString(16)) ).slice(-2) + ( i==2 ? ":" : "" );
        address = address.replace(extractIpv4, ipv4);
    }

    if (address.indexOf("::") == -1) fullAddress = address; // All eight groups are present.
    else {  // Consecutive groups of zeroes have been collapsed with "::".
        const sides = address.split("::"); let groupsPresent = 0;
        for (let i=0; i<sides.length; i++) groupsPresent += sides[i].split(":").length;
        fullAddress += sides[0] + ":";
        for (let i=0; i<validGroupCount-groupsPresent; i++) fullAddress += "0000:";
        fullAddress += sides[1];
    }
    const groups = fullAddress.split(":");
    for (let i=0; i<validGroupCount; i++) {
        while(groups[i].length < validGroupSize) groups[i] = "0" + groups[i];
        expandedAddress += (i!=validGroupCount-1) ? groups[i] + ":" : groups[i];
    }
    return expandedAddress;
}

/**
 * Takes in an IP and returns either embedded IPv4 (if it is IPv6 with IPv4 embedded) or
 * the IP itself, along with its family.
 * @param {string} ip 
 * @return {object} Returns an object of format {ip: the actual IP, ipv6: true if it is ipv6 else false}
 */
function analyzeIPAddr(ip) {
    let ipv6 = true; let ipBack = ip;

    if (ip.indexOf(":") != -1 && ip.indexOf(".") != -1 && (ip.indexOf("ffff") != 1)) {  // embedded IPv4
        ipv6 = false;
        ipBack = ip.substring(ip.lastIndexOf("ffff:")+5);
    }

    if (ip.indexOf(":") == -1 && ip.indexOf(".") != -1) ipv6 = false;   // regular IPv4

    return {ip: ipBack, ipv6};  // rest are all regular IPv6
}

/**
 * Takes in an IP, extracts the actual IP, expands IPv6 etc. Returns basically
 * the actual real IP.
 * @param {string} ip 
 */
function normalizeIP(ip) {
    const ipAnalyzed = analyzeIPAddr(ip);
    return ipAnalyzed.ipv6?expandIPv6Address(ipAnalyzed.ip):ipAnalyzed.ip;
}

/**
 * Returns true if the given string is an IP, else not (probably hostname).
 * @param {string} ip 
 */
function isThisAnIP(ip) {
    if (ip.includes(":")) return true;    // ipv6
    return ip.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/);
}

/**
 * Returns true if IPs are equal, else false. Will expand, and extract embedded IPv4s etc.
 * @param {string} ip1 
 * @param {string} ip2 
 */
const compareIPs = (ip1, ip2) => normalizeIP(ip1) == normalizeIP(ip2);

module.exports = { getDateTime, getIPAsBytes, getIPFromBytes, expandIPv6Address, analyzeIPAddr, normalizeIP, compareIPs, isThisAnIP };