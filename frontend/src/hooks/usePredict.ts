import { useMutation } from '@tanstack/react-query'
import { predict } from '../lib/api'
import type { PredictionRequest, PredictionResponse } from '../types'

export const usePredict = () => {
  return useMutation<PredictionResponse, Error, PredictionRequest>({
    mutationFn: predict,
  })
}

export default usePredict