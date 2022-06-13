import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/lib/integration/react'
import { store, persistor } from '@/Store'
import ApplicationNavigator from '@/Navigators/Application'
import './Translations'
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper'
import FlashMessage, {
  showMessage,
  hideMessage,
} from 'react-native-flash-message'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { bleManager } from './Config/bleManager'
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#ff5733',
    accent: 'yellow',
  },
}

const App = () => {
  const [savedDevice, setSavedDevice] = React.useState(null)
  const [connected, setConnected] = React.useState(false)
  const connectToDevice = async device => {
    AsyncStorage.getItem('savedDeviceId').then(value => {
      if (value) {
        setSavedDevice(value)
        bleManager.state().then(state => {
          console.log(state)
          if (state === 'PoweredOn') {
            console.log('Connecting to saved device')
            bleManager.startDeviceScan(null, null, (error, device) => {
              if (error) {
                console.log(error)
                showMessage({
                  message: 'Error connecting to device',
                  type: 'danger',
                  description: error.message,
                })
              } else {
                console.log(device.id, device.localName)
                if (device.id == value) {
                  console.log('device found')
                  bleManager.stopDeviceScan()
                  bleManager
                    .connectToDevice(device.id)
                    .then(connectedDevice => {
                      console.log('connected')
                      console.log(connectedDevice)
                      setConnected(true)

                      showMessage({
                        message: 'Device connected',
                        type: 'success',
                        icon: 'auto',
                        duration: 3000,
                      })
                      bleManager.onDeviceDisconnected(device.id, () => {
                        console.log('disconnected')
                        setConnected(false)
                        connectToDevice()
                        showMessage({
                          message: 'Device disconnected',
                          icon: 'warning',
                          type: 'danger',
                        })
                      })
                    })
                }
              }
            })
          } else {
            console.log('BLE is not powered on')
            showMessage({
              message: 'BLUETOOTH is not powered on',
              type: 'danger',
            })
          }
        })
      } else {
        console.log('no saved device')
      }
    })
  }
  useEffect(() => {
    connectToDevice()
  }, [])

  return (
    <Provider store={store}>
      {/**
       * PersistGate delays the rendering of the app's UI until the persisted state has been retrieved
       * and saved to redux.
       * The `loading` prop can be `null` or any react instance to show during loading (e.g. a splash screen),
       * for example `loading={<SplashScreen />}`.
       * @see https://github.com/rt2zz/redux-persist/blob/master/docs/PersistGate.md
       */}
      <PersistGate loading={null} persistor={persistor}>
        <PaperProvider theme={theme}>
          <ApplicationNavigator />
          <FlashMessage position="top" />
        </PaperProvider>
      </PersistGate>
    </Provider>
  )
}

export default App
