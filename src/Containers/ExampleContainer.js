import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  StatusBar,
} from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import React, { useEffect, useRef } from 'react'
import {
  Appbar,
  Card,
  Title,
  IconButton,
  Colors,
  Paragraph,
  AnimatedFAB,
} from 'react-native-paper'
import moment from 'moment'
import { red100 } from 'react-native-paper/lib/typescript/styles/colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import { navigate } from '@/Navigators/utils'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { bleManager } from '@/Config/bleManager'
import { showMessage } from 'react-native-flash-message'
import base64 from 'react-native-base64'
const serviceUUID = 'eeec6dc2-696b-4f0d-bc70-7c439b0a737'
const actuatorCharacteristicUUID = 'dc0a2321-2a16-4640-b5fc-e2f5b3c13bab'
const batteryCharacteristicUUID = '2471a35d-9c7d-40e3-b7cc-7328869aa213'
const App = () => {
  const animatedScale = useRef(new Animated.Value(0)).current
  const animatedScale2 = useRef(new Animated.Value(0)).current
  const [deviceId, setDeviceId] = React.useState(null)
  const [connected, setConnected] = React.useState(false)
  useEffect(() => {
    animatedScale.setValue(1)
    animatedScale2.setValue(1)
  }, [])

  // Top Arrow Button press Handler
  ////////////////////////////////
  const handleButtonPress = () => {
    animatedScale.setValue(0.8)
    Animated.spring(animatedScale, {
      toValue: 1,
      // bounciness:1,
      // speed:0.5,
      useNativeDriver: true,
    }).start()
    savePressToStorage('Up')
    console.log('Up Arrow pressed')
  }

  //Bottom Arrow Button Press Handler
  /////////////////////////////////
  const handleButton = () => {
    animatedScale2.setValue(0.8)
    Animated.spring(animatedScale2, {
      toValue: 1,
      //bounciness:0,
      //speed:0.5,
      useNativeDriver: true,
    }).start()
    savePressToStorage('Down')
    console.log('Down Arrow pressed')
  }

  const randomNumber = (start, end) => {
    return Math.floor(Math.random() * (end - start + 1) + start)
  }
  const readCharacteristic = async () => {
    try {
      const characteristic = await bleManager.readCharacteristicForDevice(
        deviceId,
        serviceUUID,
        batteryCharacteristicUUID,
      )

      console.log('Battery Level: ', characteristic.value)
      return characteristic.value
    } catch (error) {
      console.log('Error reading battery level: ', error)
    }
    return null
  }

  const sendBLECommand = async position => {
    if (deviceId) {
      const command = position == 'Up' ? '2' : '1'
      // encode to base64
      const encodedCommand = base64.encode(command)
      // send command to device
      try {
        await bleManager.writeCharacteristicWithoutResponseForDevice(
          deviceId,
          serviceUUID,
          actuatorCharacteristicUUID,
          encodedCommand,
        )
        return true
      } catch (error) {
        console.log('Error sending command: ', error)

        showMessage({
          message: 'Error sending command',
          description: error.message,
          type: 'danger',
        })
        return false
      }
      return false
    }
  }

  const savePressToStorage = async position => {
    if (await checkIfDeviceConnected()) {
      try {
        const result = await sendBLECommand(position)
        console.log(result, 'result')
        if (result) {
          const batteryLevel = await readCharacteristic()

          let data = await AsyncStorage.getItem('@items')
          if (data) {
            data = JSON.parse(data)
            const key = data.length
            console.log(key)

            data.push({
              key: key + 1,
              position: position,

              battery: batteryLevel ?? 'N/A',
              // moment format to date
              date: moment().format('YYYY-MM-DD'),
              time: moment().format('HH:mm'),
            })
            await AsyncStorage.setItem('@items', JSON.stringify(data))
          } else {
            data = [
              {
                key: 1,
                position: position,

                battery: randomNumber(0, 100),
                // moment format to date
                date: moment().format('YYYY-MM-DD'),
                time: moment().format('HH:mm'),
              },
            ]
            await AsyncStorage.setItem('@items', JSON.stringify(data))
          }
        }
      } catch (error) {
        // Error saving data
      }
    } else {
      showMessage({
        message: 'Device not connected',
        description: 'Please connect to device',
        type: 'warning',
        icon: 'warning',
        color: 'white',
        duration: 2000,
      })
    }
  }

  const checkIfDeviceConnected = async () => {
    const value = await getDeviceId()

    console.log('Checking if device is connected', value)
    if (value != null) {
      const status = await bleManager.isDeviceConnected(value)
      console.log('Device is connected', status)
      setConnected(status)
      return status
    }
    return false
  }

  const getDeviceId = async () => {
    try {
      const value = await AsyncStorage.getItem('savedDeviceId')
      if (value !== null) {
        setDeviceId(value)
        return value
      } else {
        setDeviceId(null)
        return null
      }
    } catch (e) {
      // error reading value
    }
  }

  useEffect(() => {
    getDeviceId()
  }, [])

  return (
    <SafeAreaView style={styles.background}>
      <StatusBar barStyle="light-content" backgroundColor="#ff5733" />
      <Text style={styles.header}>Aid's Up</Text>
      <View style={styles.container}>
        {/* Connection Menu Button Design*/}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ marginBottom: 100 }}
          onPress={() => navigate('Connection Menu')}
        >
          <View style={[styles.topCard]}>
            <Text
              style={{
                marginTop: 30,
                fontSize: 18,
                color: 'black',
                textAlign: 'center',
              }}
            >
              Connection Menu
            </Text>
          </View>
        </TouchableOpacity>

        {/* Top Arrow Button Design */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleButtonPress}>
          <Animated.View
            style={[styles.topArrow, { transform: [{ scale: animatedScale }] }]}
          >
            <View>
              <View style={styles.baseTop} />
              <View style={styles.baseBottom}>
                <Text
                  style={{ fontSize: 15, color: 'black', textAlign: 'center' }}
                >
                  Up
                </Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Bottom Arrow Button Design */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleButton}>
          <Animated.View
            style={[
              styles.topArrow,
              { transform: [{ scale: animatedScale2 }] },
            ]}
          >
            <View>
              <View style={styles.reverseTop} />
              <View style={styles.reverseBottom}>
                <Text
                  style={{
                    marginTop: 45,
                    fontSize: 15,
                    color: 'black',
                    textAlign: 'center',
                  }}
                >
                  Down
                </Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Data History Button Design */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ marginTop: 100 }}
          onPress={() => navigate('Data History')}
        >
          <View style={[styles.bottomCard]}>
            <Text
              style={{
                marginTop: 30,
                fontSize: 18,
                color: 'black',
                textAlign: 'center',
              }}
            >
              Data History
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default App
const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  background: {
    backgroundColor: '#ff5733',
    flex: 1,
  },
  header: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 25,
    fontWeight: 'bold',
    color: Colors.white,
  },
  topCard: {
    height: 100,
    width: 300,
    borderRadius: 10,
    elevation: 4,
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
  },
  bottomCard: {
    height: 100,
    width: 300,
    borderRadius: 10,
    elevation: 4,
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
  },
  container: {
    alignItems: 'center',
    marginTop: 20,
  },
  baseTop: {
    borderBottomWidth: 70,
    borderBottomColor: '#D3D3D3',
    borderLeftWidth: 80,
    borderLeftColor: 'transparent',
    borderRightWidth: 80,
    borderRightColor: 'transparent',
    height: 0,
    width: 0,
    left: -39,
    top: -70,
    position: 'absolute',
  },
  baseBottom: {
    backgroundColor: '#D3D3D3',
    height: 65,
    width: 80,
    alignItems: 'center',
    marginBottom: 100,
  },
  reverseTop: {
    borderLeftWidth: 80,
    borderLeftColor: 'transparent',
    borderRightWidth: 80,
    borderRightColor: 'transparent',
    borderTopWidth: 70,
    borderTopColor: '#D3D3D3',
    height: 0,
    width: 0,
    left: -41,
    top: 65,
    position: 'absolute',
  },
  reverseBottom: {
    backgroundColor: '#D3D3D3',
    height: 65,
    width: 80,
    alignItems: 'center',
  },
})
