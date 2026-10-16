import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform} from 'react-native';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS} from '../../src/constants/colors';

export default function GoogleCallback() {
  const router=useRouter();
  const [status,setStatus]=useState('Επαλήθευση σύνδεσης...');
  const [signedIn,setSignedIn]=useState(false);
  useEffect(()=>{
    let active=true;
    if(Platform.OS!=='web') {setStatus('Η σύνδεση είναι διαθέσιμη στο web.');return;}
    fetch('/api/auth/me',{credentials:'include',cache:'no-store'})
      .then(async r=>{if(!r.ok)throw Error('Unauthenticated');return r.json();})
      .then(me=>{
        if(active){
          setSignedIn(true);
          setStatus('Καλώς ήρθατε, '+me.name+'! Ο λογαριασμός Google συνδέθηκε με ασφάλεια. Η διαχείριση οικογένειας δεν είναι ακόμη διαθέσιμη.');
        }
      })
      .catch(()=>{if(active)setStatus('Δεν ολοκληρώθηκε η σύνδεση. Δοκιμάστε ξανά.');});
    return()=>{active=false;};
  },[]);
  const onExit=async()=>{
    if(Platform.OS==='web' && signedIn)await fetch('/api/auth/logout',{method:'POST',credentials:'include'}).catch(()=>{});
    router.replace('/welcome');
  };
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Habit Hero</Text>
        <Text style={styles.status}>{status}</Text>
        {!signedIn && status.startsWith('Επαλήθευση') && <ActivityIndicator size="large" color={COLORS.softBlue}/>}
        <TouchableOpacity accessibilityRole="button" onPress={onExit} style={styles.button}>
          <Text style={styles.buttonText}>{signedIn?'Αποσύνδεση':'Επιστροφή'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:COLORS.lightGray},
  content:{flex:1,justifyContent:'center',alignItems:'center',padding:24},
  emoji:{fontSize:64,marginBottom:16},
  title:{fontSize:32,fontWeight:'bold',color:COLORS.softBlue,marginBottom:20},
  status:{fontSize:17,textAlign:'center',color:COLORS.darkGray,marginBottom:24},
  button:{backgroundColor:COLORS.softBlue,borderRadius:10,paddingHorizontal:24,paddingVertical:12},
  buttonText:{fontWeight:'bold',color:'white'}
});
