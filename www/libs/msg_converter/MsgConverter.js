class MsgPacket {

    static parsePacket(message) {
        return JSON.parse(message)
    }

    static dumpPacket(message) {
        return JSON.stringify(message)
    }
}