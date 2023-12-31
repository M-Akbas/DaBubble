import { ElementRef, Injectable } from '@angular/core';
import { Channel } from 'src/app/models/channel';
import { User } from 'src/app/models/user';
import { UserService } from './user.service';
import { Message } from 'src/app/models/message';
import { ChannelService } from './channel.service';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  showSideLeft: boolean = true;
  showCreateChannel: boolean = false;
  showAddMembers: boolean = false;
  showAddMembersInExistingChannel: boolean = false;
  dialogGeneralData: boolean = true;
  radioButtonFirst: boolean = true;
  inputName: string = '';
  inputDescription: string = '';
  inputMember: string = '';
  inputCertainMembers: User[] = [];
  allCurrentChannels: Channel[] = [];
  threadContainerIsVisible: boolean = true;
  showEmojis: boolean = false;
  allChatsTemp: any[] = [];

  constructor(private us: UserService, private cs: ChannelService) { }

  closeSideLeft() {
    this.showSideLeft = this.showSideLeft ? false : true;
  }

  openCloseCreateChannel() {
    this.showCreateChannel = this.showCreateChannel ? false : true;
    this.clearValues();
  }

  closeAddMembers() {
    this.showAddMembers = false;
    this.clearValues();
  }

  clearValues() {
    if (!this.showCreateChannel) {
      this.showCreateChannel = false;
      this.dialogGeneralData = true;
      this.radioButtonFirst = true;
      this.inputName = '';
      this.inputMember = '';
      this.inputDescription = '';
      this.inputCertainMembers = [];
      this.showAddMembers = false;
    }
  }

  addReaction(emojiPath: string, messageType: string, clickedContact: User, clickedChannel: Channel, messageData: Message, data: Message) {
    // messageData kommt von Direktnachrichten; data von Channel-Nachrichten
    if (messageType == 'directMessage') {
      this.us.updateUser({ chats: this.allChatsWithNewEmoji(clickedContact, messageType, emojiPath, messageData) }, clickedContact);
    } else {
      this.cs.updateChannel({ allMessages: this.allChatsWithNewEmoji(clickedChannel, messageType, emojiPath, data) }, clickedChannel);
    }
    this.showEmojis = !this.showEmojis;
  }

  allChatsWithNewEmoji(chatroom: any, messageType: string, newEmojiPath: string, messageData: Message) {
    this.allChatsTemp = [];

    const messagesArray = messageType === 'directMessage' ? chatroom.chats : chatroom.allMessages;

    if (messagesArray) {
      for (let index = 0; index < messagesArray.length; index++) {
        const chat = messagesArray[index];
        const messageDBId = chat.messageId;               // messageId from message in Database
        const messageClickedId = messageData.messageId;   // messageId from message clicked to add emoji

        this.chatWithNewEmoji(chat, messageClickedId, messageDBId, newEmojiPath);
      }
    }
    return this.allChatsTemp;
  }


  chatWithNewEmoji(chat: Message, messageClickedId: number, messageDBId: number, newEmojiPath: string) {
    // wenn die messageId der alten Nachricht gleich der messageId der bearbeiteten Nachricht ist
    // so soll die neue Nachricht eingetragen werden.

    if (messageDBId === messageClickedId) {
      let emojiPathIndex = this.emojiAlreadyExits(chat.emojis, newEmojiPath);
      if (emojiPathIndex == -1) {
        chat.emojis.push({ path: newEmojiPath, amount: 1, setByUser: this.us.userLoggedIn().customId }); // neu eingegebener Emojipfad für Message
        // wenn das Emoji bereits existiert und eingeloggter User noch nicht dieses Emoji vergeben hat, dann Emoji-Anzahl erhöhen
      } else if (chat.emojis[emojiPathIndex]['setByUser'] !== this.us.userLoggedIn().customId) {
        chat.emojis[emojiPathIndex].amount = chat.emojis[emojiPathIndex]['amount'] + 1;
      } else if ((chat.emojis[emojiPathIndex]['setByUser'] == this.us.userLoggedIn().customId)) { // (eigenes) Emoji entfernen
        chat.emojis.splice(emojiPathIndex, 1);
      }
      this.allChatsTemp.push(chat);
      // für alle anderen Nachrichten die alte Nachricht übernehmen
    } else {
      this.allChatsTemp.push(chat);
    }
  }

  emojiAlreadyExits(emojis: { path: string, amount: number, setByUser: string }[], newEmojiPath: string): number {

    for (let emojiPathIndex = 0; emojiPathIndex < emojis.length; emojiPathIndex++) {
      const emoji = emojis[emojiPathIndex];
      if (emoji.path == newEmojiPath) {
        return emojiPathIndex;
      }
    }
    return -1;
  }
}