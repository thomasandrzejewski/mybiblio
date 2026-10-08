/**
 * Récupère les informations d'un livre via son ISBN sur Open Library API
 * @param {string} isbn - Le code ISBN ou EAN du livre
 * @returns {Promise<{title, author, cover_url}|null>}
 */
export async function searchBookByISBN(isbn) {
  if (!isbn || isbn.trim().length < 10) {
    throw new Error('ISBN invalide. Veuillez entrer un code d\'au moins 10 caractères.');
  }

  // Nettoyer l'ISBN : supprimer les tirets et espaces
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  try {
    // API Open Library : https://openlibrary.org/api/books?jscmd=details&bibkeys=ISBN:...&format=json
    const response = await fetch(
      `https://openlibrary.org/api/books?jscmd=details&bibkeys=ISBN:${encodeURIComponent(cleanISBN)}&format=json`
    );

    if (!response.ok) {
      throw new Error(`Erreur API : ${response.status}`);
    }

    const data = await response.json();

    // Vérifier si un livre a été trouvé
    const bookKey = `ISBN:${cleanISBN}`;
    if (!data[bookKey]) {
      throw new Error('Aucun livre trouvé avec cet ISBN.');
    }

    const book = data[bookKey];

    // Extraire les informations
    const title = book.details?.title || 'Titre inconnu';
    
    // Récupérer le premier auteur (peut être un objet ou une chaîne)
    let author = '';
    if (book.details?.authors && book.details.authors.length > 0) {
      author = typeof book.details.authors[0] === 'string' 
        ? book.details.authors[0] 
        : book.details.authors[0].name || '';
    }

    // Récupérer l'URL de la couverture
    let coverUrl = null;
    if (book.cover) {
      coverUrl = book.cover.large || book.cover.medium || book.cover.small;
    }

    return {
      title: title.trim(),
      author: author.trim(),
      coverUrl: coverUrl
    };

  } catch (error) {
    console.error('Erreur lors de la recherche ISBN:', error);
    throw error;
  }
}

/**
 * Valide un ISBN (simple vérification de format)
 * @param {string} isbn
 * @returns {boolean}
 */
export function isValidISBN(isbn) {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  // ISBN-10 ou ISBN-13
  return /^(\d{10}|\d{13})$/.test(cleanISBN);
}
