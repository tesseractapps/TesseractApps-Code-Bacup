import { LightningElement, api, track } from 'lwc';

export default class SpeechToText extends LightningElement {
    @api value;
    @api showMuteIcon = false;

    @track isListening = false;
    recognition;

    get shouldShowMute() {
        return this.showMuteIcon || this.isListening;
    }

    get showClearIcon() {
        return (this.showMuteIcon || this.isListening) && this.value && this.value.length > 0;
    }

    get iconName() {
        return this.isListening ? 'utility:unmuted' : 'utility:muted';
    }

    get altText() {
        return this.isListening ? 'Unmute' : 'Mute';
    }

    disconnectedCallback() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    toggleListening() {
        try {
            this.isListening = !this.isListening;
            if (this.isListening) {
                this.startListening();
            } else {
                this.stopListening();
            }
        } catch (error) {
            console.error("Error in toggleListening:", error.message);
        }
    }

    startListening() {
        try {
            console.log("Listening started...");
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.continuous = true;
                recognition.interimResults = false;

                recognition.onresult = (event) => {
                    let newText = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        newText += event.results[i][0].transcript;
                    }
                    if (newText) {
                        this.dispatchEvent(new CustomEvent('transcript', {
                            detail: { text: newText }
                        }));
                    }
                };

                recognition.onerror = (event) => {
                    console.error("Error during speech recognition:", event.error);
                };

                recognition.onend = () => {
                    console.log("Recognition ended");
                    this.isListening = false;
                };

                recognition.start();
                this.recognition = recognition;
            } else {
                console.error("SpeechRecognition API not supported by this browser.");
                alert("SpeechRecognition API is not supported in this browser.");
                this.isListening = false;
            }
        } catch (error) {
            console.error("Error in startListening:", error.message);
            this.isListening = false;
        }
    }

    @api
    stopListening() {
        try {
            console.log("Listening stopped...");
            if (this.recognition) {
                this.recognition.stop();
                this.recognition = null;
            }
            this.isListening = false;
        } catch (error) {
            console.error("Error in stopListening:", error.message);
        }
    }

    clearText() {
        try {
            if (this.isListening) {
                this.stopListening();
            }
            this.dispatchEvent(new CustomEvent('clear'));
        } catch (error) {
            console.error("Error in clearText:", error.message);
        }
    }
}