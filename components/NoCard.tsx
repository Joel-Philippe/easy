import { Flex, Alert, AlertIcon } from '@chakra-ui/react'

const NoCard = () => {
  return (
    <Flex>
        <Alert status='warning'>
            <AlertIcon />
            Pas de proposition pour le moment
        </Alert>
    </Flex>
)
}

export default NoCard
