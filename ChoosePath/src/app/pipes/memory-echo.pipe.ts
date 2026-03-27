/**
 * MemoryEchoPipe - Injects memory context into narrative text
 * Simplified to work with the translated MemoryService
 */
import { Pipe, PipeTransform, inject } from '@angular/core';
import { MemoryService } from '../services/memory.service';

@Pipe({
  name: 'memoryEcho',
  standalone: true,
  pure: false
})
export class MemoryEchoPipe implements PipeTransform {
  private readonly memoryService = inject(MemoryService);

  transform(text: string, highlightClass: string = 'memory-echo'): string {
    if (!text) return '';

    const memories = this.memoryService.memories();
    const memValues = Object.values(memories);
    if (memValues.length === 0) return text;

    // Build keywords from stored memories
    const keywords = memValues.map(m => m.who.toLowerCase()).filter(w => w.length > 3);
    if (keywords.length === 0) return text;

    // Build regex pattern from keywords
    const escapedKeywords = keywords.map((k: string) => 
      k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    
    const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
    
    // Replace with highlighted span
    return text.replace(pattern, 
      `<span class="${highlightClass}" data-memory="true">$1</span>`
    );
  }
}