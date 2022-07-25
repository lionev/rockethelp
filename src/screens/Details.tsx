import { useState, useEffect } from 'react';

import firestore from '@react-native-firebase/firestore'

import { VStack, Text, HStack, useTheme, ScrollView, Box } from 'native-base';

import { useNavigation, useRoute } from '@react-navigation/native';

import { CircleWavyCheck, Hourglass, DesktopTower, Clipboard } from 'phosphor-react-native'

import { Header } from '../components/Header';
import { OrderProps } from '../components/Order';
import { OrderFirestoreDTO } from '../DTOs/OrderFirestoreDTO';
import { dateFormat } from '../utils/firestoreDateFormat';
import { Loading } from '../components/Loading'
import { CardDetails } from '../components/CardDetails'
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from 'react-native';

type RouteParams = {
  orderId: string
}

type OrderDetails = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {
  const [solution, setSolution] = useState('')
  const [isLoading, setIsloading] = useState(true)
  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails)

  const { colors } = useTheme()

  const routes = useRoute()
  const navigation = useNavigation()


  function handleOrderClose(){
    if(!solution){
      return Alert.alert('Solicitação','Preencha a solução')
    }

    firestore()
    .collection<OrderFirestoreDTO>('orders')
    .doc(orderId)
    .update({
      status: 'closed',
      solution,
      closed_at: firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      Alert.alert('Solicitação', 'Solicitação encerrada.');
      navigation.goBack()
    })
    .catch(error => {
      console.log(error)
      Alert.alert('Solicitação', 'Não foi possivel encerrar a solicitação.')
    });
  }

  const { orderId } = routes.params as RouteParams;

    useEffect(() => {
      firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .get()
      .then((doc) => {
        const { patrimony, description, status, created_at, closed_at, solution} = doc.data()

        const closed = closed_at ? dateFormat(closed_at) : null
        
        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: dateFormat(created_at),
          closed
        });

        setIsloading(false)
      })
    },[])

    if(isLoading){
      return <Loading />
    }

    return (
    <VStack flex={1} bg="gray.700">
      <Box px={6} bg="gray.600">
        <Header title='Solicitação'/>
      </Box>
      <HStack bg="gray.500" justifyContent="center" p={4}>
        {
          order.status === 'closed' 
          ? <CircleWavyCheck size={22} color={colors.green[300]}/> 
          : <Hourglass size={22} color={colors.secondary[700]}/>
        }

        <Text 
          fontSize="sm"
          color={order.status === 'closed' ? colors.green[300] : colors.secondary[700]}
          ml={2}
          textTransform="uppercase"
        >
          {order.status === 'closed'? "finalizado" : "em andamento"}
        </Text>
      </HStack>

      <ScrollView mx={5} showsVerticalScrollIndicator={false}>
        <CardDetails
          title="Equipamento"
          description={`Patrimonio ${order.patrimony}`}
          icon={DesktopTower}
          footer={order.when}
        />
        
        <CardDetails
          title="Descrição do problema"
          description={`Patrimonio ${order.description}`}
          icon={Clipboard}
        />

        <CardDetails
          title="Solução"
          icon={CircleWavyCheck}
          description={order.solution}
          footer={order.closed && `Encerrado em ${order.closed}`}
        >
          {
            order.status === 'open' &&
            <Input 
            placeholder="Descrição da solução"
            onChangeText={setSolution}
            textAlignVertical="top"
            multiline
            h={24}
          />}
        </CardDetails>
      </ScrollView>

      {
        order.status === 'open' && 
        <Button 
          title="Encerrar solicitação"
          m={5}
          onPress={handleOrderClose}
        /> 
      }
    </VStack>
  );
}