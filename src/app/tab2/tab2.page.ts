import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Book, BookService } from '../services/book.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {
  books: Book[] = [];
  loadError = false;
  searchTerm = '';
  selectedCategory = 'All';
  private stopWatching?: () => void;

  constructor(
    private readonly bookService: BookService,
    private readonly alertController: AlertController,
    private readonly loadingController: LoadingController,
    private readonly toastController: ToastController,
    private readonly ngZone: NgZone,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ionViewWillEnter(): void {
    this.stopWatching?.();
    this.stopWatching = this.bookService.watchBooks(
      (books) => this.ngZone.run(() => {
        this.books = books;
        this.loadError = false;
        this.changeDetectorRef.detectChanges();
      }),
      () => this.ngZone.run(() => {
        this.loadError = true;
        this.changeDetectorRef.detectChanges();
        return this.showToast('Could not load books. Check your Firebase read permissions.', 'danger');
      }),
    );
  }

  ionViewWillLeave(): void {
    this.stopWatching?.();
    this.stopWatching = undefined;
  }

  get filteredBooks(): Book[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.books.filter((book) => {
      const matchesCategory = this.selectedCategory === 'All' || book.category === this.selectedCategory;
      const matchesSearch = !term || `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }

  get categories(): string[] {
    return ['All', ...new Set(this.books.map((book) => book.category).filter(Boolean))];
  }

  async editBook(book: Book): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Edit book',
      inputs: [
        { name: 'title', type: 'text', value: book.title, placeholder: 'Title' },
        { name: 'author', type: 'text', value: book.author, placeholder: 'Author' },
        { name: 'year', type: 'number', value: book.year, placeholder: 'Publication year' },
        { name: 'category', type: 'text', value: book.category, placeholder: 'Category' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Save', handler: (data: { title: string; author: string; year: number; category: string }) => this.saveEdit(book, data) },
      ],
    });
    await alert.present();
  }

  async deleteBook(book: Book): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete this book?',
      message: `Delete “${book.title}” from your library?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.removeBook(book) },
      ],
    });
    await alert.present();
  }

  reloadBooks(): void {
    this.stopWatching?.();
    this.stopWatching = this.bookService.watchBooks(
      (books) => this.ngZone.run(() => {
        this.books = books;
        this.loadError = false;
        this.changeDetectorRef.detectChanges();
      }),
      () => this.ngZone.run(() => {
        this.loadError = true;
        this.changeDetectorRef.detectChanges();
        return this.showToast('Could not load books. Check your Firebase read permissions.', 'danger');
      }),
    );
  }

  private async saveEdit(book: Book, data: { title: string; author: string; year: number; category: string }): Promise<void> {
    if (!data.title?.trim() || !data.author?.trim() || !data.category?.trim()) {
      await this.showToast('Title, author, and category are required.', 'warning');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Updating book...' });
    await loading.present();
    try {
      await this.bookService.updateBook({
        ...book,
        title: data.title.trim(),
        author: data.author.trim(),
        category: data.category.trim(),
        year: Number(data.year),
      });
      await this.showToast('Book updated.', 'success');
    } catch {
      await this.showToast('The book could not be updated.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async removeBook(book: Book): Promise<void> {
    const loading = await this.loadingController.create({ message: 'Deleting book...' });
    await loading.present();
    try {
      await this.bookService.deleteBook(book.id as string);
      await this.showToast('Book deleted.', 'success');
    } catch {
      await this.showToast('The book could not be deleted.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2200, color, position: 'bottom' });
    await toast.present();
  }
}
