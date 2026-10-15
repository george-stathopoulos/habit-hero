// Greek gender-aware text utilities

export type Gender = 'boy' | 'girl';

// Pronouns and articles based on gender
export const getPronouns = (gender: Gender) => {
  if (gender === 'girl') {
    return {
      // Subject pronouns
      subject: 'αυτή',      // she
      subjectCap: 'Αυτή',   // She
      
      // Object pronouns  
      object: 'την',        // her
      objectTonic: 'αυτήν', // her (tonic)
      
      // Possessive
      possessive: 'της',    // her/hers
      
      // Articles
      article: 'η',         // the (fem)
      articleAcc: 'την',    // the (fem acc)
      
      // Adjective endings
      adjEnding: 'η',       // -η ending for feminine
      
      // Child reference
      child: 'η κόρη σας',  // your daughter
      childShort: 'η κόρη', // the daughter
    };
  } else {
    return {
      // Subject pronouns
      subject: 'αυτός',     // he
      subjectCap: 'Αυτός',  // He
      
      // Object pronouns
      object: 'τον',        // him
      objectTonic: 'αυτόν', // him (tonic)
      
      // Possessive
      possessive: 'του',    // his
      
      // Articles
      article: 'ο',         // the (masc)
      articleAcc: 'τον',    // the (masc acc)
      
      // Adjective endings
      adjEnding: 'ος',      // -ος ending for masculine
      
      // Child reference
      child: 'ο γιος σας',  // your son
      childShort: 'ο γιος', // the son
    };
  }
};

// Common phrases with gender
export const getGenderedText = (gender: Gender) => {
  const isFemale = gender === 'girl';
  
  return {
    // Welcome messages
    welcome: isFemale ? 'Καλώς ήρθες!' : 'Καλώς ήρθες!',
    
    // Task completion
    didGreat: isFemale ? 'Τα πήγες υπέροχα!' : 'Τα πήγες υπέροχα!',
    wellDone: isFemale ? 'Μπράβο σου!' : 'Μπράβο σου!',
    
    // Encouragement
    youCan: isFemale ? 'Μπορείς!' : 'Μπορείς!',
    keepGoing: isFemale ? 'Συνέχισε έτσι!' : 'Συνέχισε έτσι!',
    
    // Status
    isReady: isFemale ? 'είναι έτοιμη' : 'είναι έτοιμος',
    completed: isFemale ? 'ολοκλήρωσε' : 'ολοκλήρωσε',
    needsHelp: isFemale ? 'χρειάζεται βοήθεια' : 'χρειάζεται βοήθεια',
    
    // Child descriptions for parents
    yourChild: isFemale ? 'Η κόρη σας' : 'Ο γιος σας',
    childDid: isFemale ? 'Η κόρη σας ολοκλήρωσε' : 'Ο γιος σας ολοκλήρωσε',
    childNeeds: isFemale ? 'Η κόρη σας χρειάζεται' : 'Ο γιος σας χρειάζεται',
  };
};

// For help request messages
export const getHelpRequestText = (childName: string, gender: Gender, habitName: string) => {
  const pronouns = getPronouns(gender);
  return `${pronouns.article} ${childName} χρειάζεται βοήθεια με: ${habitName}`;
};

// For completion messages
export const getCompletionText = (childName: string, gender: Gender, habitName: string) => {
  const pronouns = getPronouns(gender);
  return `${pronouns.article} ${childName} ολοκλήρωσε: ${habitName}`;
};
