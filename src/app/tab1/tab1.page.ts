import { Component } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { Book, BookService } from '../services/book.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  newBook: Omit<Book, 'id'> = this.emptyBook();

  constructor(
    private readonly bookService: BookService,
    private readonly loadingController: LoadingController,
    private readonly toastController: ToastController,
  ) {}

  async addBook(): Promise<void> {
    if (!this.newBook.title.trim() || !this.newBook.author.trim() || !this.newBook.category) {
      await this.showToast('Please complete the required fields.', 'warning');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Saving book...' });
    await loading.present();
    try {
      await this.bookService.addBook({ ...this.newBook, title: this.newBook.title.trim(), author: this.newBook.author.trim() });
      this.newBook = this.emptyBook();
      await this.showToast('Book added successfully.', 'success');
    } catch {
      await this.showToast('The book could not be saved.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private emptyBook(): Omit<Book, 'id'> {
    return { title: '', author: '', category: 'Fiction', year: new Date().getFullYear(), available: true };
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2200, color, position: 'bottom' });
    await toast.present();
  }
}
