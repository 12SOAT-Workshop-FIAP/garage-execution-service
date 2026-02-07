import { Controller, Get, Post, Body, Patch, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExecutionService } from './execution.service';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { UpdateExecutionDto } from './dto/update-execution.dto';

@ApiTags('executions')
@Controller('executions')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova execução' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Execução criada' })
  create(@Body() createDto: CreateExecutionDto) {
    return this.executionService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as execuções' })
  findAll() {
    return this.executionService.findAll();
  }

  @Get('queue')
  @ApiOperation({ summary: 'Ver fila de execução' })
  getQueue() {
    return this.executionService.getQueue();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar execução por ID' })
  findOne(@Param('id') id: string) {
    return this.executionService.findOne(id);
  }

  @Get('work-order/:workOrderId')
  @ApiOperation({ summary: 'Buscar execução por OS' })
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.executionService.findByWorkOrder(workOrderId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar execução' })
  update(@Param('id') id: string, @Body() updateDto: UpdateExecutionDto) {
    return this.executionService.update(id, updateDto);
  }

  @Post(':id/start-diagnosis')
  @ApiOperation({ summary: 'Iniciar diagnóstico' })
  startDiagnosis(@Param('id') id: string) {
    return this.executionService.startDiagnosis(id);
  }

  @Post(':id/complete-diagnosis')
  @ApiOperation({ summary: 'Completar diagnóstico' })
  completeDiagnosis(@Param('id') id: string, @Body('notes') notes: string) {
    return this.executionService.completeDiagnosis(id, notes);
  }

  @Post(':id/start-repair')
  @ApiOperation({ summary: 'Iniciar reparo' })
  startRepair(@Param('id') id: string) {
    return this.executionService.startRepair(id);
  }

  @Post(':id/complete-repair')
  @ApiOperation({ summary: 'Completar reparo' })
  completeRepair(@Param('id') id: string, @Body('notes') notes: string) {
    return this.executionService.completeRepair(id, notes);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Finalizar execução' })
  complete(@Param('id') id: string) {
    return this.executionService.complete(id);
  }
}
