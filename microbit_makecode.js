serial.redirectToUSB()

basic.showIcon(IconNames.Asleep)

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let msg = serial.readLine().trim()

    if (msg == "OK") {
        music.playTone(523, music.beat(BeatFraction.Half))
        basic.showIcon(IconNames.Happy)

    } else if (msg == "NO_FOOD") {
        music.playTone(196, music.beat(BeatFraction.Whole))
        basic.showString("NO FOOD")
        basic.showIcon(IconNames.Sad)

    } else if (msg == "NOT_EATING") {
        music.playTone(175, music.beat(BeatFraction.Whole))
        basic.showString("EAT?")
        basic.showIcon(IconNames.Sad)

    } else if (msg == "WATCHING") {
        basic.showString("WATCH")

    } else {
        music.playTone(131, music.beat(BeatFraction.Whole))
        basic.showIcon(IconNames.No)
    }
})
