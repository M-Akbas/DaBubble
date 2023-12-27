import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SideRightComponent } from 'src/app/components/dashboard/side-right/side-right.component';
import { WorkspaceService } from 'src/app/shared/services/workspace.service';

@Component({
  selector: 'app-message-reaction',
  templateUrl: './message-reaction.component.html',
  styleUrls: ['./message-reaction.component.scss']
})
export class MessageReactionComponent {
  @Input() withEditMessageOption: boolean = true; // edit message option only for own messages available
  showEditMessageButton: boolean = false;
  @Output() editMode: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(public ws: WorkspaceService) { }

  editMessageButton() {
    this.showEditMessageButton = !this.showEditMessageButton;
  }

  editMessageButton1() {
    // Handle editMessageButton1
  }

  editMessageButton2() {
    // Handle editMessageButton2
  }

  editMessageButton3() {
    // Handle editMessageButton3
  }

  prepareToeditMessage() {
    this.showEditMessageButton = false;
    this.editMode.emit(true);
  }

  

}
