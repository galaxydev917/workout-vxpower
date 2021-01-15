import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input, SecurityContext } from '@angular/core';
// import { Plugins, Capacitor, CameraSource, CameraResultType, CameraDirection } from '@capacitor/core';
import { Camera, CameraOptions,  Direction, PictureSourceType } from '@ionic-native/Camera/ngx';
import { AlertController, Platform, ActionSheetController } from '@ionic/angular';
import { FilePath } from '@ionic-native/file-path/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { File, FileEntry } from '@ionic-native/File/ngx';
import _FILE from '../../helpers/file-helper';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})

export class ImagePickerComponent implements OnInit {
  // @ViewChild('filePicker') filePickerRef: ElementRef<HTMLInputElement>;
  @Output() selectPhoto = new EventEmitter<any>();
  @Output() imagePick = new EventEmitter<any>();
  @Input() buttonText: string;
  // @Output() processedPhoto = new EventEmitter<any>();
  // @Output() preSelectedImage = new EventEmitter<string>();
  //@Input() showPreview = false;
  // @Input() showExistingPhoto: string | File;
  // 
  // @Input() cameraDirection: string;

  selectedImage: any;
  showPreview = false;
  usePicker = true;
  isLoading = false;
  blobImage: any;
  croppedImagePath = "";
  photo : any;
  constructor(
    private platform: Platform,
    private sanitizer: DomSanitizer,
    private camera: Camera,
    private filePath: FilePath,
    private file: File,
    private webview: WebView,
    public alertController: AlertController,
    public actionSheetController: ActionSheetController,
  ) { }


  ngOnInit() {
  //   console.log("image component====", this.showExistingPhoto);
  //  if (this.showExistingPhoto) {
  //   this.selectedImage = this.showExistingPhoto['imageUrl'] ? this.showExistingPhoto['imageUrl'] : this.showExistingPhoto;
  //   this.showPreview = true;
  //  }

  //   if ((this.platform.is('mobile') && !this.platform.is('hybrid')) || this.platform.is('desktop')) {
  //     this.usePicker = true;
  //   }
  }

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
        header: "Select Image source",
        buttons: [{
                text: 'Load from Library',
                handler: () => {
                    this.onPickImage(this.camera.PictureSourceType.PHOTOLIBRARY);
                }
            },
            {
                text: 'Use Camera',
                handler: () => {
                    this.onPickImage(this.camera.PictureSourceType.CAMERA);
                }
            },
            {
                text: 'Cancel',
                role: 'cancel'
            }
        ]
    });
    await actionSheet.present();
}

  onPickImage(sourceType: PictureSourceType) {
    var options: CameraOptions = {
        quality: 50,
        targetWidth: 600,
        targetHeight: 600,
        sourceType: sourceType,
        saveToPhotoAlbum: false,
        correctOrientation: true
    };
 
    this.camera.getPicture(options).then(imagePath => {
        if (this.platform.is('android') && sourceType === this.camera.PictureSourceType.PHOTOLIBRARY) {
            this.filePath.resolveNativePath(imagePath)
                .then(filePath => {
                    let correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
                    let currentName = imagePath.substring(imagePath.lastIndexOf('/') + 1, imagePath.lastIndexOf('?'));
                    this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
                });
        } else {
            var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
            var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
            this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
            
        }
    });
 
  }
  createFileName() {
    var d = new Date(),
        n = d.getTime(),
        newFileName = n + ".jpg";
    return newFileName;
 }
 
 copyFileToLocalDir(namePath, currentName, newFileName) {
   console.log("copyFileToLocalDir");
    this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFileName).then(success => {
      let filePath = this.file.dataDirectory + newFileName;
      let resPath = this.pathForImage(filePath);
      this.photo = {
          name: newFileName,
          path: resPath,
          filePath: filePath
      };
      this.showPreview = true;
      this.selectPhoto.emit(this.showPreview);
      this.convertFiletoBlob();  

    }, error => {
        console.log('Error while storing file.');
    });
  }
  pathForImage(img) {
    if (img === null) {
      return '';
    } else {
      let converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  convertFiletoBlob() {
    this.file.resolveLocalFilesystemUrl(this.photo.filePath)
        .then(entry => {
            ( < FileEntry > entry).file(file => this.readFile(file))
        })
        .catch(err => {
            console.log('Error while reading file.');
        });
  }

  readFile(file: any) {
    console.log("readFile", file);
    const reader = new FileReader();
    reader.onload = () => {
        const imgBlob = new Blob([reader.result], {
            type: file.type
        });
        
        
        this.imagePick.emit(imgBlob);
    };
    reader.readAsArrayBuffer(file);
  }
}
