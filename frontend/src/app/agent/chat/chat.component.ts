import { Component, OnInit, Input,AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { trigger,style,transition,animate,keyframes,query,stagger } from '@angular/animations';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  animations: [

    trigger('listAnimation', [
      transition('* => *', [

        query(':enter', style({ opacity: 0 }), {optional: true}),

        query(':enter', stagger('500ms', [
          animate('.3s ease-in-out', keyframes([
            style({opacity: 0, offset: 0}),
            style({opacity: .5, offset: 0.5}),
            style({opacity: 1,  offset: 1.0}),
          ]))]), {optional: true})
      ])
    ])

  ]
})

export class ChatComponent implements OnInit {
  chatInitial;
  chatCurrent;
  
  messages: Message[] = [];
  prettyChatCurrent;

  chatForm: FormGroup;
  chatFormFields: any;
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  
  listening: boolean = false;

  constructor(
    public fb: FormBuilder,
    public chatService: ChatService) {

    this.chatFormFields = {
      input: [''],
    };
    this.chatForm = this.fb.group(this.chatFormFields);

  }

  ngOnInit() {
    this.chatInitial = {
      'currentNode': '',
      'complete': null, 
      'context': [{
        "name": "global",
        "parameters": {
          "name": "Alfred",
        },
        "lifespan":-1
    }],
      'parameters': [],
      'extractedParameters': {},
      'speechResponse': '',
      'intent': {},
      'input': '',
      'event':'init_conversation',
      'missingParameters': []
    };

    this.chatService.converse(this.chatInitial)
      .then((c: any) => {
        c.owner = 'chat';
        this.changeCurrent(c);

        this.render_bubbles(c)
      });
  }


scrollToBottom(): void {
    try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }                 
}

  render_bubbles(c){
    c.speechResponse.forEach((item, index) => {
      if (index  == 0){
          this.add_to_messages(item,"chat")
      }else{
        setTimeout(()=>{
          this.add_to_messages(item,"chat")
        },500)
      }

  });
  }
  add_to_messages(message,author){
      let new_message = new Message(message,author)
      this.messages.push(new_message);
      setTimeout(()=>{
        this.scrollToBottom();
      },300)
      
  }
  
  changeCurrent(c) {
    c.date = new Date();
    this.chatCurrent = c;
    this.prettyChatCurrent = JSON ? JSON.stringify(c, null, '  ') : 'your browser doesnt support JSON so cant pretty print';
  }

  send() {
    const form = this.chatForm.value;
    const sendMessage = {
      ... this.chatCurrent,
      input: form.input,
      owner: 'user'
    };
    this.add_to_messages(form.input,"user")

    this.changeCurrent(sendMessage);
    this.chatService.converse(sendMessage)
      .then((c: any) => {
        c.owner = 'chat';
        this.changeCurrent(c);
        this.chatForm.reset();
        setTimeout(
          ()=>{
            this.render_bubbles(c);
          },1000
        )
        
      });

  }

  recognize(){
    /*
    Perform speech recognition using Web Speech API
    works in Google Chrome only
    */

   // disable talk button
   this.listening = true

    const {webkitSpeechRecognition} : IWindow = <IWindow>window;
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.start();
    
    recognition.onresult = (event)=> {
      var last = event.results.length - 1;
      var text = event.results[last][0].transcript;
      this.chatForm.controls['input'].setValue(text);
      console.log(text)
      console.log('Confidence: ' + event.results[0][0].confidence);

      this.listening = false
    }
  }

}

export class Message {
  content: string;
  author: string;

  constructor(content: string, author: string){
    this.content = content;
    this.author = author;
  }
}

export interface IWindow extends Window {
  webkitSpeechRecognition: any;
}