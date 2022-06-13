import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { DataTable, ActivityIndicator } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

const numberOfItemsPerPageList = [5, 10, 20, 50, 100]

const DataHistory = () => {
  const [page, setPage] = React.useState(0)
  const [numberOfItemsPerPage, onItemsPerPageChange] = React.useState(
    numberOfItemsPerPageList[1],
  )
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const from = page * numberOfItemsPerPage

  const to = Math.min((page + 1) * numberOfItemsPerPage, items.length)

  const loadFromAsyncStorage = async () => {
    try {
      const value = await AsyncStorage.getItem('@items')
      if (value !== null) {
        // We have data!!
        // arrange items by key descending
        let items = JSON.parse(value)
        items.sort((a, b) => {
          return b.key - a.key
        })
        setItems(items)
        setLoading(false)
      }
      setLoading(false)
    } catch (error) {
      console.log(error)
      // Error retrieving data
    }
  }

  React.useEffect(() => {
    setPage(0)
    loadFromAsyncStorage()
  }, [numberOfItemsPerPage])

  return (
    <ScrollView>
      {loading ? (
        // center activicty indicator
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 100,
          }}
        >
          {/* add fading animation  */}

          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      ) : (
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Time</DataTable.Title>
            <DataTable.Title>Position</DataTable.Title>
            <DataTable.Title>Battery</DataTable.Title>
          </DataTable.Header>

          {items.slice(from, to).map(item => (
            <DataTable.Row key={item.key}>
              <DataTable.Cell>{item.date}</DataTable.Cell>
              <DataTable.Cell>{item.time}</DataTable.Cell>
              <DataTable.Cell>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View>
                    <Text> {item.position}</Text>
                  </View>
                  <View>
                    {item.position == 'Up' && (
                      <MaterialIcons name="arrow-upward" size={18} />
                    )}
                    {item.position == 'Down' && (
                      <MaterialIcons name="arrow-downward" size={18} />
                    )}
                  </View>
                </View>
              </DataTable.Cell>
              <DataTable.Cell>{item.battery}%</DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(items.length / numberOfItemsPerPage)}
            onPageChange={page => setPage(page)}
            label={`${from + 1}-${to} of ${items.length}`}
            showFastPaginationControls
            numberOfItemsPerPageList={numberOfItemsPerPageList}
            numberOfItemsPerPage={numberOfItemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            selectPageDropdownLabel={'Rows per page'}
          />
        </DataTable>
      )}
    </ScrollView>
  )
}

export default DataHistory
