import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
// import { Channel } from 'src/app/interfaces/channel';
import { Channel } from 'src/app/models/channel';
import { UserService } from './user.service';
import { User } from 'src/app/models/user';
import { Message } from 'src/app/models/message';
import { MessageTime } from 'src/app/models/message-time';
import { ThreadInterface } from 'src/app/interfaces/thread.interface';
@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  firestore: Firestore = inject(Firestore);
  allChannelsCol = collection(this.firestore, 'channels');
  allUsersCol = collection(this.firestore, 'users');
  allMessagesChannel: any = [];
  myChannels: any = {};
  myThreads: any = {};
  threadsOfMessage = new BehaviorSubject<ThreadInterface[]>([]);

  clickedChannelId = new BehaviorSubject<string>('');
  clickedChannel = new BehaviorSubject<Channel>(new Channel());
  clickedMessage!: Message;
  clickedUser = new BehaviorSubject<User>(new User());
  newChannel!: Channel;
  loadingUpdateData = false;
  unsubChannels;
  unsubThreads;

  constructor(private us: UserService) {
    this.unsubChannels = this.subChannelList();
    this.unsubThreads = this.subThreadList();
  }

  // Collection Channels beobachten
  async subChannelList() {
    const qu = query(collection(this.firestore, 'channels'));
    onSnapshot(qu, (querySnapshot) => {
      // bei jeder Änderung in der Collection folgendes tun:
      this.myChannels = [];
      // Für jeden Channel in Channels (aus Firebase)...
      querySnapshot.forEach((element) => {
        // ... Array myChannels füllen
        this.myChannels.push(this.setChannelObject(element.data(), element.id));
        this.setCurrentChannel(this.clickedChannelId.value);
      });
    });
  }

  setCurrentChannel(elementId: string) {
    const channelList = this.myChannels;
    if (this.myChannels) {
      // für alle Channels in Firebase
      for (let index = 0; index < channelList.length; index++) {
        // wenn es sich um den aktuell angezeigten Channel handelt...
        if (elementId == channelList[index]['customId']) {
          // setze den aktuellen Channel (Objekt) gemäß angeklickter Channel Id
          this.clickedChannel.next(channelList[index]);
        }
      }
    }
  }

  // Collection Channels beobachten
  async subThreadList() {
    const qu = query(collection(this.firestore, 'channels'));
    onSnapshot(qu, (querySnapshot) => {
      // bei jeder Änderung in der Collection folgendes tun:
      querySnapshot.forEach((element) => {
        // ... Threads speichern, die in ausgewählter Message enthalten sind
        this.myThreads = {};
        let allMessages = this.setChannelObject(element.data(), element.id).allMessages;
        allMessages.forEach((message) => {
          if (this.clickedMessage && (message.messageId === this.clickedMessage.messageId)) {
            this.myThreads = message;
            this.setCurrentThreads();
            return;
          }
        });

      });
    });
  }

  setCurrentThreads() {
    const messageList: any[] = [];
    if (this.myThreads) {
      for (let index = 0; index < this.myThreads['threads'].length; index++) {
        const thread = this.myThreads['threads'][index];
        messageList.push(thread)
      }
      this.threadsOfMessage.next(messageList);
    }
  }

  

  setChannelView(id: string) {
    this.clickedChannelId.next(id);
    this.setCurrentChannel(this.clickedChannelId.value);
  }

  setChannelObject(obj: any, id: string): Channel {
    return new Channel(
      id,
      obj.name,
      obj.description,
      obj.members,
      obj.createdDate,
      obj.createdBy,
      obj.allMessages
    );
  }

  // dies ist notwendig, da in Firebase (nur) Json gespeichert wird
  getCleanChannelJson(channel: Channel): {} {
    return {
      customId: channel.customId,
      name: channel.name,
      description: channel.description,
      members: this.getCleanMemberArrayJson(channel.members),
      createdDate: channel.createdDate,
      createdBy: this.us.getCleanUserJson(channel.createdBy),
      allMessages: channel.allMessages,
    };
  }

  getCleanMessageTimeJson(messageTime: MessageTime) {
    return {
      day: messageTime.day,
      fullDay: messageTime.fullDay,
      time: messageTime.time
    }
  }

  getCleanMemberJson(members: User[]): {} {
    const memberArray = [];
    for (let index = 0; index < members.length; index++) {
      const member = members[index];
      const memberAsJson = this.us.getCleanUserJson(member);
      memberArray.push(memberAsJson);
    }
    return memberArray;
  }

  getCleanMemberArrayJson(members: User[]): {} {
    const memberArray = [];
    for (let index = 0; index < members.length; index++) {
      const member = members[index];
      const memberAsJson = this.us.getCleanUserJson(member);
      memberArray.push(memberAsJson);
    }
    return memberArray;
  }

  async getAllMessagesFromChannel(id: string) {
    const allMsgRef = doc(this.firestore, `channels/${id}`);
    const docSnapshot = await getDoc(allMsgRef);

    if (docSnapshot.exists()) {
      const allMessagesArray = docSnapshot.get('allMessages') || [];
      this.allMessagesChannel = [];
      this.allMessagesChannel.push(allMessagesArray);

    } else {
      console.error('Dokument existiert nicht für die ID:', id);
    }
  }



  async sendMessageToDB(obj: {}, id: string) {
    const allMsgRef = doc(this.firestore, `channels/${id}`);
    const docSnapshot = await getDoc(allMsgRef);
    if (docSnapshot.exists()) {
      this.updateMessage(obj, docSnapshot, allMsgRef);
      this.getAllMessagesFromChannel(id);
    } else {
      console.error('Dokument existiert nicht für die ID:', id);
    }
  }



  async updateMessage(obj: {}, docSnapshot: any, allMsgRef: any) {
    const allMessagesFromDB = docSnapshot.get('allMessages') || [];
    this.allMessagesChannel.push(allMessagesFromDB);
    allMessagesFromDB.push(obj);
    await updateDoc(allMsgRef, { allMessages: allMessagesFromDB });
  }

  async sendDocToDB(item: Channel) {
    await addDoc(this.allChannelsCol, this.getCleanChannelJson(item));
  }

  async writeUserData(channel: Channel, userId: string) {
    await setDoc(doc(this.firestore, 'channels', userId), channel);
  }

  async updateChannel(newValue: any, channel: Channel) {
    this.loadingUpdateData = true;
    let docRef = this.getSingleDocRef('channels', channel.customId);
    await updateDoc(docRef, newValue)
      .catch((err) => {
        console.log(err);
      })
      .then(() => {
        this.loadingUpdateData = false;
      });
  }

  getSingleDocRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  async leaveChannel() {
    const channelId = this.clickedChannelId.value;
    const channel = this.myChannels.find(
      (ch: Channel) => ch.customId === channelId
    );

    if (channel) {
      // User logged in: hier sei vorläufig User logged in Markus mit Id 5oDYsPkUGMb9FPqmqNGB
      const userIdToRemove = this.us.userLoggedIn().customId;
      const updatedMembers = channel.members.filter(
        (member: User) => member.customId !== userIdToRemove
      );
      this.updateChannel(
        { members: updatedMembers },
        this.clickedChannel.value
      );
    }
  }

  getTime(): string {
    const now: Date = new Date();
    const hours: string = ('0' + now.getHours()).slice(-2);
    const minutes: string = ('0' + now.getMinutes()).slice(-2);
    const timeString: string = `${hours}:${minutes}`;
    // console.log(timeString);
    return timeString + ' Uhr';
  }

  todaysDate(): string {
    const today = new Date();
    const weekdays = [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ];
    const weekday = weekdays[today.getDay()];
    const day = today.getDate();
    const month = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(
      today
    );

    const todayAsString = `${weekday}, ${day}. ${month}`;

    return todayAsString;
  }

  isToday(dayTocheck: number) {
    const today = new Date();
    const todaysDay = today.getDate();
    return todaysDay == dayTocheck;
  }

  // Ausgabe, ob das Datum einer neu erstellte Message höher ist als das der letzten Nachricht
  checkIfNewDay(chatsofUser: Message[] | ThreadInterface[] | undefined, index: number): boolean {
    // erster Eintrag immer mit Datum
    if (index == 0) {
      return true
    }

    if (chatsofUser !== undefined && index > 0 && chatsofUser![index - 1]) {
      // prüfe, ob Tag von vorherigem chat kleiner || (Tag von vorherigem chat größer && Nr. Date.now() von gestern kleiner)
      try {
        if (chatsofUser![index - 1] && chatsofUser![index - 1]['createdTime']['day'] < chatsofUser![index]['createdTime']['day'] ||
        chatsofUser![index - 1]['createdTime']['day'] > chatsofUser![index]['createdTime']['day'] && chatsofUser[index - 1]['messageId'] < chatsofUser![index]['messageId']) {
        return true;
      }
      } catch (error) {
        console.log(error, 'und', chatsofUser![index - 1]);
        
      }
      return false;
    }
    return false;
  }



  // sending message to firebase allMessages array[] with help of customId of current channel
  sendMessageToChannel(id: any, message: Message) {
    // const allChannelsRef = collection(this.firestore, `channels/${id}/allMessages`);
    // addDoc(allChannelsRef, message);
    // console.log('Message und Id', message, id);
  }
}
