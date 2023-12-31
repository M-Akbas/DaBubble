import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SideRightComponent } from 'src/app/components/dashboard/side-right/side-right.component';
import { Channel } from 'src/app/models/channel';
import { Message } from 'src/app/models/message';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/shared/services/user.service';
import { WorkspaceService } from 'src/app/shared/services/workspace.service';
import { ThreadInterface } from 'src/app/interfaces/thread.interface';
import { ThreadService } from 'src/app/shared/services/thread.service';

@Component({
  selector: 'app-message-reaction',
  templateUrl: './message-reaction.component.html',
  styleUrls: ['./message-reaction.component.scss']
})
export class MessageReactionComponent {
  @Input() withEditMessageOption: boolean = true; // edit message option only for own messages available
  showEditMessageButton: boolean = false;
  @Output() editMode: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() newThread: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() messageOfLoggedInUser: boolean = false;
  
  @Input() messageData: Message = new Message();
  @Input() data: Message = new Message();
  @Input() threadMessageData!: ThreadInterface;
  @Input() clickedContact!: User;
  @Input() clickedChannel!: Channel;
  @Input() messageType!: string;
  moreReactions: boolean = false;

  constructor(public ws: WorkspaceService, public us: UserService, public ts: ThreadService) { }

  editMessageButton() {
    this.showEditMessageButton = !this.showEditMessageButton;
  }

  editMessageButton1() {
    // Handle editMessageButton1
  }

  handUpReaction() {
    // Handle editMessageButton2
  }

  prepareToeditMessage() {
    this.showEditMessageButton = false;
    this.editMode.emit(true);
  }

  threadToSend(){
    this.ts.showThreads(this.data)
    this.ts.createOrShowThread(this.data);
    this.newThread.emit(true);
  }

  showMoreReactions() {
    this.moreReactions = !this.moreReactions;
  }

  hasThreadOption(): boolean{
    return this.messageType == 'channelMessage';
  }

}
