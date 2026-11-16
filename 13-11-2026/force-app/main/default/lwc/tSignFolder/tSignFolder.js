import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import canDeleteFolder from '@salesforce/apex/tSignAttachmentHandler.canDeleteFolder';
import deleteFolder from '@salesforce/apex/tSignAttachmentHandler.deleteFolder';

const PUBLIC_NODE = 'PUBLIC_NODE';

export default class FolderNode extends LightningElement {
    @api node;
    @api level;
    @api selectedId;
    @api isStaff;
    @track showMenu = false;

    isOpen = false;

    // arrow fn: same reference for add + remove, so listener really gets removed
    _outsideClick = () => {
        this.showMenu = false;
    };

    get hasChildren() {
        return this.node.children && this.node.children.length > 0;
    }

    get nextLevel() {
        return Number(this.level) + 1;
    }

    get indentStyle() {
        return `padding-left:${this.level * 12}px`;
    }

    get computedClass() {
        return 'folder-item' + (this.node.Id === this.selectedId ? ' selected-folder' : '');
    }

    get toggleIcon() {
        return this.isOpen ? 'keyboard_arrow_down' : 'chevron_right';
    }

    get folderIcon() {
        return this.isOpen ? 'folder_open' : 'folder';
    }

    connectedCallback() {
        document.addEventListener('click', this._outsideClick);
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._outsideClick);
    }

    toggle(event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    handleClick(event) {
        event.stopPropagation();

        if (this.hasChildren) {
            this.isOpen = true;
        }

        this.dispatchEvent(new CustomEvent('folderselect', {
            detail: { id: this.node.Id },
            bubbles: true,
            composed: true
        }));
    }

    handleChildSelect(event) {
        this.dispatchEvent(new CustomEvent('folderselect', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }

    toggleMenu(event) {
        event.stopPropagation();
        this.showMenu = !this.showMenu;
    }

    handleEdit(event) {
        event.stopPropagation();

        this.dispatchEvent(new CustomEvent('editfolder', {
            detail: { id: this.node.Id },
            bubbles: true,
            composed: true
        }));

        this.showMenu = false;
    }

    handlePermissions(event) {
        event.stopPropagation();

        this.dispatchEvent(new CustomEvent('permissions', {
            detail: { id: event.currentTarget.dataset.id },
            bubbles: true,
            composed: true
        }));

        this.showMenu = false;
    }

    handleChildPermissions(event) {
        event.stopPropagation();

        this.dispatchEvent(new CustomEvent('permissions', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }

    async handleDelete(event) {
        event.stopPropagation();

        try {
            const folderId = event.currentTarget.dataset.id;

            // validate from Apex
            const isAllowed = await canDeleteFolder({ folderId });

            if (!isAllowed) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Cannot Delete Folder',
                        message: 'Folder cannot be deleted because it contains files or subfolders.',
                        variant: 'error'
                    })
                );
                return;
            }

            await deleteFolder({ folderId });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Folder deleted successfully',
                    variant: 'success'
                })
            );

            // refresh tree
            this.dispatchEvent(
                new CustomEvent('refreshfolders', {
                    bubbles: true,
                    composed: true
                })
            );

            this.showMenu = false;
        } catch (error) {
            console.error('Folder delete error:', error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error?.body?.message || 'Unable to delete folder',
                    variant: 'error'
                })
            );
        }
    }

    // the Public node is virtual, not a real folder record
    get isVirtualNode() {
        return this.node.Id === PUBLIC_NODE;
    }

    // menu only for real folders the current user is allowed to modify
    // (node.canModify is worked out in the parent component)
    get showActions() {
        return this.isStaff && !this.isVirtualNode && this.node.canModify === true;
    }

    handleRefreshFolders() {
        this.dispatchEvent(
            new CustomEvent('refreshfolders', {
                bubbles: true,
                composed: true
            })
        );
    }

    handleChildEdit(event) {
        event.stopPropagation();

        this.dispatchEvent(new CustomEvent('editfolder', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }
}