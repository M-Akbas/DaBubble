import { AuthenticationService } from './../../../shared/services/authentication.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-display-reset-pw-enter-pw',
  templateUrl: './display-reset-pw-enter-pw.component.html',
  styleUrls: ['./display-reset-pw-enter-pw.component.scss'],
})
export class DisplayResetPwEnterPwComponent {
  passwort: string = '';
  passwortConfirm: string = '';
  arrowBackIsHovered: boolean = false;
  linkIsExpired: boolean = false;
  oobCode: string;

  newPasswortForm: any = new FormGroup({
    passwordFirstInput: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(
        /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/
      ),
    ]),
    passwordSecondInput: new FormControl('', [Validators.required]),
  });

  constructor(
    private auth: AuthenticationService,
    private route: ActivatedRoute
  ) {
    this.oobCode = this.route.snapshot.queryParams['oobCode'] || null;
    this.checkPwResetLinkExpiration();
  }

  /**
   * Checks if the password reset link has expired based on the stored request time
   * in local storage. If the difference between the stored time and the current time
   * is greater than 12 hours, linkIsExpired is set to true.
   */
  checkPwResetLinkExpiration(): void {
    const storedTime = localStorage.getItem('pwResetRequestTime');
    if (!storedTime) {
      this.linkIsExpired = true;
      return;
    }
    const storedTimeObj = new Date(storedTime as string);
    const currentTime = new Date();
    const timeDifferenceInHours =
      Math.abs(currentTime.getTime() - storedTimeObj.getTime()) / 36e5;
    if (timeDifferenceInHours > 12) {
      this.linkIsExpired = true;
    }
  }

  passwordsMatch() {
    this.passwort = this.newPasswortForm.get('passwordFirstInput')?.value;
    this.passwortConfirm = this.newPasswortForm.get(
      'passwordSecondInput'
    )?.value;
    if (this.passwort === this.passwortConfirm) {
      return true;
    } else {
      return false;
    }
  }

  changePasswort() {
    this.auth.changePwWhenUserIsNotLogged(this.oobCode, this.passwort);
  }
}
