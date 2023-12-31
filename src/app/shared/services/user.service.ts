import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  onSnapshot,
  query,
  updateDoc,
  setDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { User } from 'src/app/models/user';
import { Message } from 'src/app/models/message';
import { reload } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  firestore: Firestore = inject(Firestore);
  allUserCol = collection(this.firestore, 'allUsers');
  myUsers: User[] = [];
  clickedContactId = new BehaviorSubject<string>('');
  clickedContact = new BehaviorSubject<User>(new User());
  loggedInUser!: User;

  allUsersForUserName: User[] = [];
  docIdCustomIdMatching: any = [];

  unsubUsers;

  constructor() {
    this.unsubUsers = this.subUserList();
    this.subAllUsersListFindUserName();
    
  }

  userLoggedIn(): User {
    return this.getUserFromCollection(this.loggedInUser);
  }

  async subUserList() {
    const qu = query(collection(this.firestore, 'allUsers'));
    onSnapshot(qu, (querySnapshot) => {
      this.myUsers = [];
      querySnapshot.forEach((element) => {
        this.myUsers.push(this.setUserObject(element.data()));
        this.docIdCustomIdMatching.push({
          customId: element.data()['customId'],
          docId: element.id,
        });
        this.setCurrentContact(this.clickedContactId.value);
      });
    });
  }

  async updateUser(newValue: any, user: User) {
    let docRef = this.getSingleDocRef('allUsers', user.customId);
    await updateDoc(docRef, newValue)
      .catch((err) => {
        console.log(err);
      })
      .then(() => {
        console.log('user updated');
      });
  }

  getSingleDocRef(colId: string, docId: string) {
    let realDocId = this.getRealDocId(docId);
    return doc(collection(this.firestore, colId), realDocId);
  }

  // Anhand customId aus Authentification den User in Collection allUsers finden
  getUserFromCollection(loggedInUser: User): User {
    for (let index = 0; index < this.myUsers.length; index++) {
      const user = this.myUsers[index];
      if (user.customId == loggedInUser.customId) {
        return user;
      }
    }
    return new User();
  }

  // Anhand der customId (Parameter docId) des Users, welche ihm aus Authentification übergeben wurde
  // wird seine Id in der Collection allUsers über die Matching-Tabelle "docIdCustomIdMatching" ermittelt.
  getRealDocId(docId: string) {
    const realDocId = this.docIdCustomIdMatching.find(
      (val: any) => val['customId'] === docId
    );
    return realDocId ? realDocId['docId'] : '';
  }

  setCurrentContact(elementId: string) {
    const userList = this.myUsers;
    if (this.myUsers) {
      for (let index = 0; index < userList.length; index++) {
        // wenn es sich um den aktuell angezeigten Channel handelt...
        if (elementId == userList[index]['customId']) {
          this.clickedContact.next(userList[index]);
        }
      }
    }
  }

  setContactView(id: string) {
    this.clickedContactId.next(id);
    this.setCurrentContact(this.clickedContactId.value);
  }

  setUserObject(obj: any): User {
    return new User(obj.customId, obj.name, obj.email, obj.img, obj.chats);
  }

  getCleanUserJson(user: User): {} {
    return {
      customId: user.customId,
      name: user.name,
      email: user.email,
      img: user.img || '',
      chats: this.getCleanMessageArrayJson(user.chats || [new Message()]) || [
        {},
      ],
    };
  }

  getCleanMessageArrayJson(messages: Message[]): {} {
    const messageArray = [];
    for (let index = 0; index < messages.length; index++) {
      const member = messages[index];
      const messageAsJson = this.getCleanMessageJson(member);
      messageArray.push(messageAsJson);
    }

    return messageArray;
  }

  getCleanMessageJson(message: Message): {} {
    return {
      userCustomId: message.userCustomId || '',
      messageId: message.messageId || 0,
      message: message.message || '',
      createdTime: message.createdTime || '',
      emojis: message.emojis || {},
      threads: message.threads || [],
      file: message.file || ''
    };
  }



  async sendDocToDB(item: User) {
    await addDoc(this.allUserCol, this.getCleanUserJson(item));
  }

  subAllUsersListFindUserName() {
    const q = collection(this.firestore, 'allUsers');
    return onSnapshot(q, (list) => {
      this.allUsersForUserName = [];
      list.forEach((element) => {
        this.allUsersForUserName.push(this.setUserObject(element.data()));
      });
    });
  }

  // Es werden nur Nachrichten angezeigt die (a) ich clickedContact verschickt habe oder (b) die clickedContact an verschickt hat und
  // (c) deren messageId bei mir existiert (damit nicht Nachrichten bei mir von clickedContact angezeigt werden, die er an andere User verschickt hat)
  chatsWithClickedUser() {
    let chats = this.clickedContact.value.chats?.filter((chat) =>
      chat.userCustomId == this.userLoggedIn().customId ||
      (chat.userCustomId == this.clickedContact.value.customId && this.messageExitsInOwnChats(chat.messageId)!)
    );
    return chats;
  }

  messageExitsInOwnChats(messageIdToCheck: number) {
    return this.userLoggedIn().chats?.find((chat) => chat.messageId == messageIdToCheck)
  }

  getUserName(userCustomId: string) {
    // this.subAllUsersListFindUserName();
    let user = this.allUsersForUserName.find(
      (user) => user.customId === userCustomId
    );
    return user ? user.name : 'is loading';
  }
}
