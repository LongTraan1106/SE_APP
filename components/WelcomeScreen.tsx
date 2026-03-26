import {View, Text, StyleSheet} from 'react-native';

function WelcomeScreen() {
    const userName = 'Long Traan';
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}> Welcome bitch, {userName} </Text>
            <Text style={styles.subtitle}>Dont come back !</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#285A48',
    },
    title:{
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#408A71'
    },
    subtitle:{
        fontSize: 18,
        color: '#FFFFFF'
    }
});

export default WelcomeScreen;