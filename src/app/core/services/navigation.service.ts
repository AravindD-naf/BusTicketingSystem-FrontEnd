import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Navigation Service
 * Provides safe navigation with automatic error handling
 * Prevents unhandled promise rejections from router.navigate()
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);

  /**
   * Safely navigate to a route with automatic error handling
   * @param commands Route commands
   * @param extras Optional navigation extras
   * @param errorMessage Optional custom error message to show user
   * @returns Promise<boolean> - true if navigation succeeded
   */
  async safeNavigate(
    commands: any[],
    extras?: any,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const result = await this.router.navigate(commands, extras);
      if (!result) {
        console.warn('Navigation blocked:', commands);
        if (errorMessage) {
          alert(errorMessage || 'Navigation was blocked. Please try again.');
        }
      }
      return result;
    } catch (err) {
      console.error('Navigation error:', err, 'Path:', commands);
      if (errorMessage) {
        alert(errorMessage || 'Failed to navigate. Please try again.');
      }
      return false;
    }
  }

  /**
   * Safely navigate by URL with automatic error handling
   * @param url URL to navigate to
   * @param errorMessage Optional custom error message to show user
   * @returns Promise<boolean> - true if navigation succeeded
   */
  async safeNavigateByUrl(url: string | any, errorMessage?: string): Promise<boolean> {
    try {
      const result = await this.router.navigateByUrl(url);
      if (!result) {
        console.warn('Navigation blocked:', url);
        if (errorMessage) {
          alert(errorMessage || 'Navigation was blocked. Please try again.');
        }
      }
      return result;
    } catch (err) {
      console.error('Navigation error:', err, 'URL:', url);
      if (errorMessage) {
        alert(errorMessage || 'Failed to navigate. Please try again.');
      }
      return false;
    }
  }

  /**
   * Navigate with fallback route if primary navigation fails
   * @param primaryCommands Primary route commands
   * @param fallbackCommands Fallback route commands if primary fails
   * @param extras Optional navigation extras
   * @returns Promise<boolean>
   */
  async navigateWithFallback(
    primaryCommands: any[],
    fallbackCommands: any[],
    extras?: any
  ): Promise<boolean> {
    try {
      const result = await this.router.navigate(primaryCommands, extras);
      if (result) return true;

      console.warn('Primary navigation failed, using fallback');
      return await this.router.navigate(fallbackCommands, extras);
    } catch (err) {
      console.error('Primary navigation error:', err);
      try {
        return await this.router.navigate(fallbackCommands, extras);
      } catch (fallbackErr) {
        console.error('Fallback navigation also failed:', fallbackErr);
        return false;
      }
    }
  }
}
