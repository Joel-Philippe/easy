import { Flex, Spinner } from "@chakra-ui/react"

const Loading = () => {
  return (
    <Flex justifyContent='center' alignItems='center' width='100%' height='100%'>
        <Spinner
        thickness='8px'
        speed='0.30s'
        emptyColor='rgb(115 255 0)'
        color='rgb(115 255 0)'
        size='xl'
        mt="2rem"
        />
    </Flex>
  )
}

export default Loading