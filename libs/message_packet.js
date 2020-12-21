exports.parsePacket = function(message) {
    var buf = Buffer(message, 'ascii')
    var header_size = buf.readUIntLE(0, 3)
    var size = [
        4, header_size, buf.length - 4 - header_size
    ]
    var header_json = buf.toString('ascii', 4, 4 + header_size)
    var compressed_packet = buf.toString('ascii', 4 + header_size, buf.length)
    var header = JSON.parse(header_json)
    var topic_node = header.topic_node
    var serializer = header.serializer
    var compression = header.compression
    switch (compression) {
        default:
        case 'none':
            var serialized_message = compressed_packet
            break;
    }
    switch (serializer) {
        default:
            var message = serialized_message
            var header = ""
            break;
        case 'json':
            var body = JSON.parse(serialized_message)
            var header = body.header
            var message = body.message
            break;
    }
    var result = { topic_node, message, serializer, compression, header }
    return result
}

exports.dumpPacket = function(topic_node, message, header = {}, serializer = "json", compression = "none") {

    var serialized_message = ""
    if (serializer == "json") {
        var serialized_message = JSON.stringify({ header, message })
    }

    var compressed_packet = ""
    if (compression == "none") {
        var compressed_packet = serialized_message
    }

    var header = { topic_node, serializer, compression }
    var header_json = JSON.stringify(header)
    var header_size = header_json.length
    var body_size = compressed_packet.length

    var buf = new Buffer(4 + header_size + body_size)

    // buf.writeUIntLE(header_size)
    // buf.write(header_json, 4)
    // buf.write(compressed_packet, 4 + header_size)
    
    buf.writeUIntLE(header_size, 0, 4)
    buf.write(header_json, 4, header_size)
    buf.write(compressed_packet, 4 + header_size, body_size)
    var result = buf
    return result
}