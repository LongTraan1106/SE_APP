import { StyleSheet, Text, View } from 'react-native';

function Card({ title, description , backgroundColor = '#fff' }) {
    return(
        <View style={[styles.Card, { backgroundColor }]}>
            <Text style={styles.CardTitle}>{title}</Text>
            <Text style={styles.CardDescription}>{description}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    Card:{
        borderRadius: 5,
        margin: 8,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    CardTitle:{
        fontSize: 18,
        fontWeight: 'bold',
    },
    CardDescription:{
        fontSize: 14,
        marginTop: 4,
    },
});

export default Card;