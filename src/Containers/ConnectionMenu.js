import { View, StyleSheet, FlatList } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import React, { useEffect, useRef } from 'react'
import {
  List,
  Divider,
  Modal,
  Portal,
  Text,
  Button,
  Paragraph,
  ActivityIndicator,
  Title,
  Dialog,
} from 'react-native-paper'
import moment from 'moment'
import { bleManager } from '@/Config/bleManager'
import { SafeAreaView } from 'react-native-safe-area-context'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import { showMessage, hideMessage } from 'react-native-flash-message'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ConnectionMenu = () => {
  const [visible, setVisible] = React.useState(false)
  const [devices, setDevices] = React.useState([])
  const [scanning, setScanning] = React.useState(true)
  const [savedDevice, setSavedDevice] = React.useState(null)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [connected, setConnected] = React.useState(false)

  const hideModal = () => setVisible(false)
  const getBluetoothStatus = () => {
    bleManager.state().then(state => {
      console.log(state)
    })
  }
  const requestPermissions = () => {
    return new Promise(next => {
      check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION)
        .then(result => {
          switch (result) {
            case RESULTS.UNAVAILABLE:
              console.log(
                'This feature is not available (on this device / in this context)',
              )
              break
            case RESULTS.DENIED:
              request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION).then(
                result => {
                  if (result === 'granted') {
                    next({ error: false, success: true })
                    console.log('Permission granted')
                  } else {
                    showMessage({
                      message: 'Please allow permissions to continue',
                      type: 'danger',
                    })
                    next({ error: true, success: false })

                    console.log('Permission denied')
                  }
                },
              )

              break
            case RESULTS.LIMITED:
              console.log(
                'The permission is limited: some actions are possible',
              )
              break
            case RESULTS.GRANTED:
              console.log('The permission is granted')
              break
              console.log(
                'The permission is denied and not requestable anymore',
              )
              break
          }
        })
        .catch(error => {
          // …
          next({ error: true, success: false })
        })
      request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(result => {
        if (result === 'granted') {
          next({ error: false, success: true })

          console.log('Permission granted')
        } else {
          showMessage({
            message: 'Please allow permissions to continue',
            type: 'danger',
          })
          next({ error: true, success: false })
        }
      })
    })
  }
  const scanBleDevices = async () => {
    const permissionRequest = await requestPermissions()
    if (permissionRequest.error) {
      return
    }

    setScanning(true)
    setVisible(true)
    setDevices([])
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        showMessage({
          message: 'Error scanning for devices',
          type: 'danger',
          description: error.message,
          duration: 5000,
        })
        setVisible(false)
        setScanning(false)
        console.log(error)
      } else {
        console.log(device)
        if (device.name) {
          console.log(device.id)
          console.log(device.name)
          if (!devices.some(vendor => vendor['name'] == device.name)) {
            setDevices([...devices, device])
          }
        }
      }
    })
    setTimeout(() => {
      bleManager.stopDeviceScan()
      setScanning(false)
    }, 6000)
  }
  const connectToDevice = device => {
    try {
      bleManager.connectToDevice(device.id).then(device => {
        console.log('device connected')
        setConnected(true)
        setSavedDevice(device.id)

        saveDeviceToAsyncStorage(device.id)

        showMessage({
          message: 'Device connected',
          icon: 'auto',
          type: 'success',
        })
        setVisible(false)

        device.onDisconnected(() => {
          setConnected(false)
          showMessage({
            message: 'Device disconnected',
            icon: 'warning',
            type: 'danger',
          })
        })

        device.discoverAllServicesAndCharacteristics().then(device => {
          console.log(device)
        })
      })
    } catch (e) {
      console.log(e)
    }
  }
  const saveDeviceToAsyncStorage = async value => {
    try {
      await AsyncStorage.setItem('savedDeviceId', value)
    } catch (e) {
      showMessage({
        message: 'Error saving device',
        type: 'danger',
      })
      // saving error
    }
  }
  const getSavedDeviceFromAsyncStorage = async () => {
    try {
      const value = await AsyncStorage.getItem('savedDeviceId')
      if (value !== null) {
        setSavedDevice(value)
        console.log(value)

        bleManager.isDeviceConnected(value).then(connected => {
          console.log(connected, 'is connected')
          setConnected(connected)
        })
      }
    } catch (e) {
      // error reading value
    }
  }
  const forgetDevice = async () => {
    try {
      setShowConfirm(false)
      await AsyncStorage.removeItem('savedDeviceId')
      setSavedDevice(null)
      setConnected(false)
      showMessage({
        message: 'Device forgotten',
        type: 'success',
      })
    } catch (e) {
      showMessage({
        message: 'Error forgetting device',
        type: 'danger',
      })
    }
  }

  useEffect(() => {
    getSavedDeviceFromAsyncStorage()
  }, [])

  return (
    <SafeAreaView>
      {savedDevice ? (
        <List.Section>
          <List.Item
            title={connected ? 'Connected' : 'Disconnected'}
            description={savedDevice}
            left={props => (
              <List.Icon
                {...props}
                icon="connection"
                color={connected ? 'green' : 'red'}
              />
            )}
          />

          <List.Item
            title="Forget Device"
            description="Disconnect"
            left={props => (
              <List.Icon {...props} icon="close" color="#F44336" />
            )}
            onPress={() => {
              setShowConfirm(true)
            }}
          />
        </List.Section>
      ) : (
        <List.Section>
          <List.Item
            title="Add New Device"
            onPress={() => scanBleDevices()}
            left={() => <List.Icon icon="bluetooth-connect" />}
          />
        </List.Section>
      )}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={styles.scandevices}
        >
          <Title style={{ textAlign: 'center' }}>
            Found {devices.length} devices
          </Title>
          <View style={{ paddingTop: 20 }}>
            {scanning ? (
              <View>
                <Paragraph style={{ textAlign: 'center' }}>
                  Scanning.....
                </Paragraph>

                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
              </View>
            ) : (
              <List.Section>
                <FlatList
                  data={devices}
                  renderItem={({ item }) => (
                    <List.Item
                      title={item.name}
                      onPress={() => connectToDevice(item)}
                      left={() => (
                        <List.Icon color="#287AA9" icon="bluetooth" />
                      )}
                    />
                  )}
                  keyExtractor={item => item.id}
                />
              </List.Section>
            )}
          </View>
        </Modal>
        {/* confirm disconnect dialog */}
        <Dialog
          visible={showConfirm}
          onDismiss={() => setShowConfirm(false)}
          style={{
            width: '90%',
            maxWidth: 350,
          }}
        >
          <Dialog.Title>Forget Device</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to forget this device?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirm(false)}>Cancel</Button>
            <Button onPress={() => forgetDevice()}> Forget</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

export default ConnectionMenu
const styles = StyleSheet.create({
  scandevices: {
    padding: 20,
    backgroundColor: '#fff',
  },
})
