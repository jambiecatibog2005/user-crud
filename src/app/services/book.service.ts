import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';

export interface Book {
  id?: string;
  title: string;
  author: string;
  category: string;
  year: number;
  available: boolean;
}

const firebaseApp = initializeApp(environment.firebaseConfig);
const database = getFirestore(firebaseApp);
const booksCollection = collection(database, 'books');

@Injectable({ providedIn: 'root' })
export class BookService {
  watchBooks(onChange: (books: Book[]) => void, onError?: (error: Error) => void): () => void {
    return onSnapshot(booksCollection, (snapshot) => {
      const books = snapshot.docs.map((book) => ({ id: book.id, ...book.data() })) as Book[];
      onChange(books.sort((first, second) => first.title.localeCompare(second.title)));
    }, (error) => onError?.(error));
  }

  addBook(book: Omit<Book, 'id'>): Promise<unknown> {
    return addDoc(booksCollection, book);
  }

  updateBook(book: Book): Promise<void> {
    const { id, ...bookData } = book;
    return updateDoc(doc(database, 'books', id as string), bookData);
  }

  deleteBook(id: string): Promise<void> {
    return deleteDoc(doc(database, 'books', id));
  }
}