var g_speaker = {
    // TODO 事件
    apis: {
        browser: {
            init() {
                const self = g_speaker
                this.synth = window.speechSynthesis,
                    this.synth.onvoiceschanged = () => {
                        let voice = this.voices().find(voice => voice.name == self.config.voice)
                        let utter = this.utterThis = new SpeechSynthesisUtterance();
                        utter.onerror = function(event) {}
                        utter.voice = voice
                        utter.pitch = self.config.patch + 1
                        utter.rate = self.config.rate + 1
                        utter.volume = self.config.volume || 1
                    }
            },
            voices() {
                return this.synth.getVoices()
            },
            voiceMaps(){
                return this.voices().map(voice => voice.name)
            },
            read(text, opts) {
                const self = g_speaker
                this.synth.speaking && this.synth.cancel()
                let utter = this.utterThis
                utter.text = text;
                this.synth.speak(utter);

                utter.onend = function(event) {
                    self.clear()
                    self.callEvent('onSpeakerEnded')
                }

                utter.onboundary = function(event) {
                    let { charIndex, charLength } = event
                    let start = opts.start + charIndex
                    self.clear()
                    $(g_content.getRangeDoms(opts.key, start, start + charLength)).addClass('speaking_word')
                }
            },
            stop(){
                this.synth.cancel()
            },
        },
        azure: {
            voices() {
                return new Promise(reslove => {
                    fetch('http://localhost:1233/api/azure/voices').then(resp => {
                        resp.json().then(data => {
                            reslove(data)
                        })
                    })
                })
            },
            async voiceMaps(){
                return (await this.voices()).map(voice => voice.Name)
            },
            init() {

            },
            read(text, opts) {
                return new Promise(reslove => {
                    const self = g_speaker
                    fetch('http://localhost:1233/api/azure', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain',
                            'Format': 'webm-24khz-16bit-24kbps-mono-opus'
                        },
                        body: `
                        <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
                            <voice name="${self.config.voice}">
                                <lang xml:lang="zh-CN">
                                    <mstts:express-as style="general" styledegree="1.0" role="default">
                                        <prosody rate="${self.config.rate * 100}%" pitch="${self.config.pitch * 100}%">${text}</prosody >
                                    </mstts:express-as>
                                </lang>
                            </voice >
                       </speak >`
                    }).then(resp => {
                        resp.blob().then(blob => {
                            let audio = self.audio = new Audio()
                            audio.src = URL.createObjectURL(blob)
                            audio.volume = self.config.volume
                            audio.getProgress = () => parseInt(self.audio.currentTime / self.audio.duration * 100)
                            audio.play()
                            audio.onended = e => self.callEvent('onSpeakerEnded')
                            reslove(audio)
                        })
                    })
                })
            },
            stop(){
                const self = g_speaker
                if(self.audio){
                    self.audio.remove()
                    delete self.audio
                }
            },
        }
    },
    callEvent(eventName, params = {}){
        g_plugin.callEvent(eventName, params)
    },
    clear() {
        $('.speaking_word').removeClass('speaking_word')
    },
    init() {
        const self = this
        g_style.addStyle('speaker', `
            .speaking_word {
                background-color: red;
                color: white;
            }
        `)
        Config.init(self, 'tts', {
            rate: 1,
            pitch: 1,
            volume: 1,
            voice: 'Microsoft Sayaka - Japanese (Japan)',
            system: 'browser',
        })

        g_action.registerAction({
            modal_tts() {
                self.modal()
            },
            speaker_onChooseSystem(dom){
                console.log(dom.value)
            }
        })

        self.initSystem()
    },
    getSystem() {
        return this.apis[this.config.system]
    },

    initSystem() {
        this.getSystem().init()
    },

    async modal() {
        const self = this
        g_form.confirm1({
            title: 'TTS设置',
            elements: {
                system: {
                    title: '语音系统',
                    type: 'select',
                    list: ['browser', 'azure'],
                    required: true,
                    value: self.config.system,
                    props: 'data-change="speaker_onChooseSystem"',
                },
                voice: {
                    title: '语音人',
                    type: 'select',
                    list: await this.getSystem().voiceMaps(),
                    required: true,
                    value: self.config.voice,
                },
                rate: {
                    title: 'rate',
                    type: 'range',
                    opts: {
                        step: 0.1,
                        max: 1,
                        min: -1,
                    },
                    value: self.config.rate,
                },
                pitch: {
                    title: 'pitch',
                    type: 'range',
                    opts: {
                        step: 0.1,
                        max: 1,
                        min: -1,
                    },
                    value: self.config.pitch,
                },
                volume: {
                    title: 'volume',
                    type: 'range',
                    opts: {
                        step: 0.1,
                        max: 1,
                    },
                    value: self.config.volume,
                },
            },
            callback({ vals }) {
                Object.assign(self.config, vals)
                self.saveConfig()
                self.initSystem()
            }
        })
    },

    setPatch(v) {
        this.setConfig('patch', v * 1)
    },

    setRate(v) {
        this.setConfig('rate', v * 1)
    },

    setVolume(v) {
        this.setConfig('volume', v * 1)
    },


    read(text, opts = {}) {
        let system = this.getSystem()
        system.read(text, opts).then(audio => {
            audio.ontimeupdate = () => {
                let progress = audio.getProgress()
                !isNaN(progress) && g_plugin.callEvent('onSpeakerProgress', {progress})
            }
        })
    },

    stop(){
        this.getSystem().stop()
    },
}
g_speaker.init();