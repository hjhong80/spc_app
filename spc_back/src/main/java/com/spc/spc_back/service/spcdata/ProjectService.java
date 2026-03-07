package com.spc.spc_back.service.spcdata;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.CharacteristicAddReqDto;
import com.spc.spc_back.dto.spcdata.ProjectAddReqDto;
import com.spc.spc_back.entity.spcdata.Characteristic;
import com.spc.spc_back.entity.spcdata.Project;
import com.spc.spc_back.repository.CharacteristicRepository;
import com.spc.spc_back.repository.ProjectRepository;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.util.RoleAccessUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final CharacteristicRepository characteristicRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ApiRespDto<List<Project>> GetProjectList(PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        List<Project> projectList = projectRepository.selectProjectList().orElseGet(Collections::emptyList);
        return new ApiRespDto<>("success", "프로젝트 목록을 조회했습니다.", projectList);
    }

    public ApiRespDto<Project> GetProjectByProjId(Long projId, PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        if (projId == null || projId <= 0L) {
            return new ApiRespDto<>("failed", "유효하지 않은 프로젝트 ID입니다.", null);
        }

        Optional<Project> foundProject = projectRepository.selectProjectByProjId(projId);
        if (foundProject.isEmpty()) {
            return new ApiRespDto<>("failed", "프로젝트를 찾을 수 없습니다.", null);
        }

        return new ApiRespDto<>("success", "프로젝트를 조회했습니다.", foundProject.get());
    }

    public ApiRespDto<List<Project>> GetProjectByKeyword(String keyword, PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        List<Project> projectList = projectRepository.selectProjectListByKeyword(normalizedKeyword)
                .orElseGet(Collections::emptyList);

        return new ApiRespDto<>("success", "키워드로 프로젝트 목록을 조회했습니다.", projectList);
    }

    @Transactional
    public ApiRespDto<Project> PostAddProject(ProjectAddReqDto projectAddReqDto, PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        ApiRespDto<Project> sourceValidationResp = validateSourceConfigJson(projectAddReqDto);
        if (sourceValidationResp != null) {
            return sourceValidationResp;
        }

        Project project = projectAddReqDto.toEntity();
        int insertProjectResult = projectRepository.insertProject(project);
        if (insertProjectResult == 0 || project.getProjId() == null) {
            return new ApiRespDto<>("failed", "프로젝트 추가에 실패했습니다.", null);
        }

        List<Characteristic> characteristicList = CharacteristicAddReqDto.toList(
                projectAddReqDto.getCharacteristicList(),
                project.getProjId());
        for (Characteristic characteristic : characteristicList) {
            int insertCharacteristicResult = characteristicRepository.insertCharacteristic(characteristic);
            if (insertCharacteristicResult == 0) {
                throw new RuntimeException("특성치 추가에 실패했습니다.");
            }
        }

        Optional<Project> savedProject = projectRepository.selectProjectByProjId(project.getProjId());
        return new ApiRespDto<>("success", "프로젝트를 추가했습니다.", savedProject.orElse(project));
    }

    @Transactional
    public ApiRespDto<Project> PostModifyProject(
            Long projId,
            ProjectAddReqDto projectAddReqDto,
            PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        Optional<Project> foundProject = projectRepository.selectProjectByProjId(projId);
        if (foundProject.isEmpty()) {
            return new ApiRespDto<>("failed", "프로젝트를 찾을 수 없습니다.", null);
        }

        ApiRespDto<Project> sourceValidationResp = validateSourceConfigJson(projectAddReqDto);
        if (sourceValidationResp != null) {
            return sourceValidationResp;
        }

        Project project = projectAddReqDto.toEntity();
        project.setProjId(projId);

        int updateProjectResult = projectRepository.updateProject(project);
        if (updateProjectResult == 0) {
            return new ApiRespDto<>("failed", "프로젝트 수정에 실패했습니다.", null);
        }

        List<Characteristic> existingCharacteristicList = characteristicRepository.selectCharacteristicListByProjId(projId)
                .orElseGet(Collections::emptyList);
        for (Characteristic characteristic : existingCharacteristicList) {
            if (characteristic.getCharId() == null) {
                continue;
            }
            int deleteCharacteristicResult = characteristicRepository.deleteCharacteristic(characteristic.getCharId());
            if (deleteCharacteristicResult == 0) {
                throw new RuntimeException("특성치 교체에 실패했습니다.");
            }
        }

        List<Characteristic> newCharacteristicList = CharacteristicAddReqDto.toList(
                projectAddReqDto.getCharacteristicList(),
                projId);
        for (Characteristic characteristic : newCharacteristicList) {
            int insertCharacteristicResult = characteristicRepository.insertCharacteristic(characteristic);
            if (insertCharacteristicResult == 0) {
                throw new RuntimeException("특성치 교체에 실패했습니다.");
            }
        }

        Optional<Project> updatedProject = projectRepository.selectProjectByProjId(projId);
        return new ApiRespDto<>("success", "프로젝트를 수정했습니다.", updatedProject.orElse(project));
    }

    @Transactional
    public ApiRespDto<Void> PostDeleteProject(Long projId, PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        Optional<Project> foundProject = projectRepository.selectProjectByProjId(projId);
        if (foundProject.isEmpty()) {
            return new ApiRespDto<>("failed", "프로젝트를 찾을 수 없습니다.", null);
        }

        List<Characteristic> characteristicList = characteristicRepository.selectCharacteristicListByProjId(projId)
                .orElseGet(Collections::emptyList);
        for (Characteristic characteristic : characteristicList) {
            if (characteristic.getCharId() == null) {
                continue;
            }
            int deleteCharacteristicResult = characteristicRepository.deleteCharacteristic(characteristic.getCharId());
            if (deleteCharacteristicResult == 0) {
                throw new RuntimeException("특성치 삭제에 실패했습니다.");
            }
        }

        int deleteProjectResult = projectRepository.deleteProject(projId);
        if (deleteProjectResult == 0) {
            return new ApiRespDto<>("failed", "프로젝트 삭제에 실패했습니다.", null);
        }

        return new ApiRespDto<>("success", "프로젝트를 삭제했습니다.", null);
    }

    private <T> ApiRespDto<T> forbiddenResponse() {
        return new ApiRespDto<>("failed", RoleAccessUtil.SPC_ACCESS_DENIED_MESSAGE, null);
    }

    private ApiRespDto<Project> validateSourceConfigJson(ProjectAddReqDto projectAddReqDto) {
        if (!isValidJson(projectAddReqDto.getSerialNumberSourceJson())) {
            return new ApiRespDto<>("failed", "serialNumberSourceJson은 올바른 JSON 문자열이어야 합니다.", null);
        }

        if (!isValidJson(projectAddReqDto.getMeasurementTimeSourceJson())) {
            return new ApiRespDto<>("failed", "measurementTimeSourceJson은 올바른 JSON 문자열이어야 합니다.", null);
        }

        return null;
    }

    private boolean isValidJson(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return false;
        }

        try {
            objectMapper.readTree(rawJson);
            return true;
        } catch (JsonProcessingException exception) {
            return false;
        }
    }
}
