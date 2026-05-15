input.onButtonPressed(Button.A, function () {
    lastStatus = "RESET"
    basic.clearScreen()
    basic.pause(200)
    basic.showIcon(IconNames.Asleep)
})
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let msg = serial.readLine().trim()
lastStatus = msg
    if (msg == "WATCHING") {
        music.playTone(262, music.beat(BeatFraction.Quarter))
        basic.showIcon(IconNames.Target)
    } else if (msg == "OK") {
        music.playTone(523, music.beat(BeatFraction.Half))
        music.playTone(659, music.beat(BeatFraction.Half))
        basic.showIcon(IconNames.Happy)
    } else if (msg == "NO_FOOD") {
        music.playTone(196, music.beat(BeatFraction.Whole))
        basic.showIcon(IconNames.No)
    } else if (msg == "NOT_EATING") {
        music.playTone(175, music.beat(BeatFraction.Whole))
        basic.showIcon(IconNames.Sad)
    } else {
        music.playTone(131, music.beat(BeatFraction.Whole))
        basic.showIcon(IconNames.Confused)
    }
})
let lastStatus = ""
serial.redirectToUSB()
lastStatus = "RESET"
basic.showIcon(IconNames.Asleep)
