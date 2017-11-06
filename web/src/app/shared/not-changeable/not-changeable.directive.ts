import { Directive, HostListener } from '@angular/core';

@Directive({
    // tslint:disable-next-line:directive-selector
    selector: '[spotcafeNotChangeable]'
})
export class NotChangeableDirective {

    private allowedKeys: string[];

    constructor() {
        this.setAllowedKeys();
    }

    @HostListener('keydown', ['$event'])
    hostKeyDown(event: KeyboardEvent): void {
        if (this.allowedKeys.indexOf(event.key) < 0) {
            event.preventDefault();
            return;
        }
    }

    @HostListener('cut', ['$event'])
    hostCut(event: ClipboardEvent): void {
        event.preventDefault();
    }

    @HostListener('paste', ['$event'])
    hostPaste(event: ClipboardEvent): void {
        event.preventDefault();
    }

    private setAllowedKeys(): void {
        this.allowedKeys = [
            'ArrowLeft',
            'ArrowRight',
            'ArrowTop',
            'ArrowBottom',
            'End',
            'Home'
        ];
    }
}
